class KeyframeAnimation {
    constructor(viewer, animationName) {
        this._viewer = viewer;
        this._animation;
        this._player;
        if (undefined != animationName) {
            this._animation = new Communicator.Animation.Animation(animationName);
            this._player = this._viewer.animationManager.createPlayer(this._animation);
        }
        this._animation = new Communicator.Animation.Animation(animationName);
        this._player = this._viewer.animationManager.createPlayer(this._animation);
        this._channelMap = new Map();
        this._homeCamera;
        this._currentCamera;
        this._nodeMatrixes = {};  // Object to keep node matrix while animation
        this._nodeOpacities = {};  // Object to keep node opacity while animation
        this._nodeVisibilities = {};   // Object to keep node visibility while animation
        this._nodeColors = {};  // Object to keep node color while animation
        this._nodeLastlyRotated = {};
        this._isPause = false
    }

    setHomeCamera(camera) {
        this._homeCamera = camera;
    }

    play() {
        this.rewind();
        this._player.play();
    }

    rewind() {
        this._player.reload();
        this._isPause = false;
    }

    pause() {
        if (this._isPause) {
            this._player.play();
            }
        else {
            this._player.pause();
        }
        this._isPause = !this._isPause;
    }

    serialize() {
        this.rewind();

        const obj = Communicator.Animation.exportAnimations([this._animation]);
        return obj;
    }

    deserialize(obj) {
        const animations = Communicator.Animation.importAnimations(obj)
        this._animation = animations[0];

        this._player = this._viewer.animationManager.createPlayer(this._animation);
    }

    _setQuatAxisAngle(out, axis, rad) {
        rad = rad * 0.5;
        let s = Math.sin(rad);
        out.x = s * axis.x;
        out.y = s * axis.y;
        out.z = s * axis.z;
        out.w = Math.cos(rad);
    
        return out;
    }

    _convertLocalVector(nodeId, vector) {
        // Compute invers matrix of the parent node
        const parentNode = this._viewer.model.getNodeParent(nodeId);
        const netMatrix = this._viewer.model.getNodeNetMatrix(parentNode);
        const inverseMatrix = new Communicator.Matrix.inverse(netMatrix);

        // Convert vector in the parent node 
        const localOrg = Communicator.Point3.zero();
        inverseMatrix.transform(Communicator.Point3.zero(), localOrg);

        const localVector = Communicator.Point3.zero();
        inverseMatrix.transform(vector, localVector);

        localVector.subtract(localOrg);

        return localVector;
    }

    _convertLocalRotation(nodeId, beforeMatrix, rotationAxsis, rotationCenter, rotationAngle) {
        // Compute invers matrix of the parent node
        const parentNode = this._viewer.model.getNodeParent(nodeId);
        const netMatrix = this._viewer.model.getNodeNetMatrix(parentNode);
        const inverseMatrix = new Communicator.Matrix.inverse(netMatrix);
        
        // Conpute rotatation vector in the parent node 
        const localAxis0 = Communicator.Point3.zero();
        inverseMatrix.transform(Communicator.Point3.zero(), localAxis0);

        const localAxis = Communicator.Point3.zero();
        inverseMatrix.transform(rotationAxsis, localAxis);

        localAxis.subtract(localAxis0);

        // Create locat rotation matrix
        const rotationMatrix = Communicator.Matrix.createFromOffAxisRotation(localAxis, rotationAngle);

        // Node matrix * rotation matrix
        const multiplyMatrix = Communicator.Matrix.multiply(beforeMatrix, rotationMatrix);

        // Compute local center point
        const localCenter = Communicator.Point3.zero();
        inverseMatrix.transform(rotationCenter, localCenter);

        // Compute local center point after rotation
        const rotatePoint = Communicator.Point3.zero();
        rotationMatrix.transform(localCenter, rotatePoint);

        // Create translation matrix to shift the node arond rotation center after rotation
        const translationMatrix = new Communicator.Matrix();
        translationMatrix.setTranslationComponent(localCenter.x - rotatePoint.x, localCenter.y - rotatePoint.y, localCenter.z - rotatePoint.z);

        // Compute the node matrix of after rotation (multiplyMatrix * translationMatrix)
        const afterMatrix = Communicator.Matrix.multiply(multiplyMatrix, translationMatrix);

        return {
            localAxsis: localAxis,
            localCenter: localCenter,
            afterMatrix: afterMatrix
        };
    }

    _getTranslationChannel(nodeId, startTime) {
        const channelName = `Translate-${nodeId}`;

        // Get existing channel
        let channel = this._channelMap.get(channelName);

        if (!channel) {
            // Create a new channel
            const buffer = new Communicator.Animation.KeyframeBuffer(Communicator.Animation.KeyType.Vec3);
            const sampler = new Communicator.Animation.Sampler(buffer, Communicator.Animation.InterpolationType.Linear);
            channel = this._animation.createNodeChannel(channelName, nodeId, Communicator.Animation.NodeProperty.Translation, sampler);

            this._channelMap.set(channelName, channel);
        }
            
        const translateBuffer = channel.sampler.buffer;

        if (0  == translateBuffer.values.length) {
            // Set initial position
            translateBuffer.appendVec3Keyframe(startTime, this._nodeMatrixes[nodeId].m[12], this._nodeMatrixes[nodeId].m[13], this._nodeMatrixes[nodeId].m[14]);
        }
        else {
            // copy the previous translation keyframe value
            // this prevents any translation value change from time of previous translation keyframe to startTime
            const index = translateBuffer.values.length - translateBuffer.keyOffset;
            translateBuffer.appendVec3Keyframe(startTime, translateBuffer.values[index], translateBuffer.values[index + 1], translateBuffer.values[index + 2]);
        }

        return channel;
    }

    _getRotationChannel(nodeId, startTime) {
        let channelName = `Rotate-${nodeId}`;

        // Get existing channel
        let channel = this._channelMap.get(channelName);

        if (!channel) {
            // Create a new channel
            const buffer = new Communicator.Animation.KeyframeBuffer(Communicator.Animation.KeyType.Quat);
            const sampler = new Communicator.Animation.Sampler(buffer, Communicator.Animation.InterpolationType.Linear);
            channel = this._animation.createNodeChannel(channelName, nodeId, Communicator.Animation.NodeProperty.Rotation, sampler);
        
            this._channelMap.set(channelName, channel);
        }

        const rotateBuffer = channel.sampler.buffer;

        if (0  == rotateBuffer.values.length) {
            // Set initial rotation
            const rotation = Communicator.Quaternion.createFromMatrix(this._nodeMatrixes[nodeId]);
            rotateBuffer.appendQuatKeyframe(startTime, rotation.x, rotation.y, rotation.z, rotation.w);
        }
        else {
            // copy the previous rotation keyframe value
            // this prevents any rotation value change from time of previous rotation keyframe to startTime
            const index = rotateBuffer.values.length - rotateBuffer.keyOffset;
            rotateBuffer.appendQuatKeyframe(startTime, rotateBuffer.values[index], rotateBuffer.values[index + 1], rotateBuffer.values[index + 2], rotateBuffer.values[index + 3]);
        }

        return channel;
    }

    // Translation animation
    addTranslationAnimation(nodes, startTime, duration, translationVector, translationDistance) {
        for (const nodeId of nodes) {
            // Get initial node matrix
            if (undefined == this._nodeMatrixes[nodeId]) {
                this._nodeMatrixes[nodeId] = this._viewer.model.getNodeMatrix(nodeId);
            }

            const translateChannel = this._getTranslationChannel(nodeId, startTime);

            // It is also necessary to set initial Rotation
            const rotateChannel = this._getRotationChannel(nodeId, startTime);
            
            // Convert the translation vector in the local coordinate 
            const localVector = this._convertLocalVector(nodeId, translationVector);
            localVector.scale(translationDistance);
            
            // Update node matrix and set to buffer
            const transMatrix = new Communicator.Matrix();
            transMatrix.setTranslationComponent(localVector.x, localVector.y, localVector.z);
            const matrix = Communicator.Matrix.multiply(this._nodeMatrixes[nodeId], transMatrix);

            //It is necessary to change setting values by whether the node was lastly rotated
            if (undefined == this._nodeLastlyRotated[nodeId]) {
                // If it is not rotated, set locaiton from matrix (absolute valus)
                translateChannel.sampler.buffer.appendVec3Keyframe(startTime + duration, matrix.m[12], matrix.m[13], matrix.m[14]);
            }
            else {
                // If it is lastly rotated, set incremental valus
                translateChannel.sampler.buffer.appendVec3Keyframe(startTime + duration, localVector.x, localVector.y, localVector.z);
            }

            this._nodeMatrixes[nodeId] = matrix;

            // Unset the node is lastly rotated 
            this._nodeLastlyRotated[nodeId] = undefined;

            // console.log(JSON.stringify(translateChannel));
            // console.log(JSON.stringify(rotateChannel));
        }
    }

    addRotationAnimation(nodes, startTime, duration, rotationAxsis, rotationCenter, rotationAngle) {
        for (const nodeId of nodes) {
            // Get initial node matrix
            if (undefined == this._nodeMatrixes[nodeId]) {
                this._nodeMatrixes[nodeId] = this._viewer.model.getNodeMatrix(nodeId);
            }

            const rotateChannel = this._getRotationChannel(nodeId, startTime);

            // It is also necessary to set initial Translation
            const translateChannel = this._getTranslationChannel(nodeId, startTime);

            // Convert the rotation parameters in the local coordinate
            const localRotation = this._convertLocalRotation(nodeId, this._nodeMatrixes[nodeId], rotationAxsis, rotationCenter, rotationAngle);

            // Set rotation center point as pivotPoints
            this._animation.pivotPoints.set(nodeId, localRotation.localCenter);

            const q = Communicator.Quaternion.identity();
            this._setQuatAxisAngle(q, localRotation.localAxsis, Math.PI * rotationAngle / 180);
            rotateChannel.sampler.buffer.appendQuatKeyframe(startTime + duration,  q.x, q.y, q.z, q.w);

            // Update current node matrix
            this._nodeMatrixes[nodeId] = localRotation.afterMatrix;

            // Set true for the node is lastly rotated 
            this._nodeLastlyRotated[nodeId] = true;

            // console.log(JSON.stringify(translateChannel));
            // console.log(JSON.stringify(rotateChannel));
        }
    }

    addCameraAnimation(camera, startTime, duration) {
        // Create channels of cameta
        if (!this._channelMap.has("Camera-Position")) {
            const channels = Communicator.Animation.Util.createCameraChannels(this._animation, "Camera", Communicator.Animation.InterpolationType.Linear);
            for (const channel of channels) {
                this._channelMap.set(channel.name, channel);
            }
        }

        if (0 == startTime) {
            this._currentCamera = this._homeCamera;
        }

        // Get current camera from current view
        if (undefined == this._currentCamera) {
            this._currentCamera = this._viewer.view.getCamera();
        }

        // Add camera animation
        Communicator.Animation.Util.keyframeCamera(startTime, this._currentCamera, this._animation);

        if (0 < duration) {
            Communicator.Animation.Util.keyframeCamera(startTime + duration, camera, this._animation);
        }

        this._currentCamera = camera;
    }

    async addOpacityAnimation(nodes, startTime, duration, opacity) {
        for (const nodeId of nodes) {
            // Get initial node opacity
            if (undefined == this._nodeOpacities[nodeId]) {
                const opacity = await this._viewer.model.getNodesOpacity([nodeId]);
                if (opacity[0] == null) {
                    this._nodeOpacities[nodeId] = 1.0;
                }
                else {
                    this._nodeOpacities[nodeId] = opacity[0];
                }
            }

            const channelName = `Opacity-${nodeId}`;

            // Get existing channel
            let channel = this._channelMap.get(channelName);

            if (!channel) {
                // Create a new channel
                const buffer = new Communicator.Animation.KeyframeBuffer(Communicator.Animation.KeyType.Scalar);
                const sampler = new Communicator.Animation.Sampler(buffer, Communicator.Animation.InterpolationType.Linear);
                channel = this._animation.createNodeChannel(channelName, nodeId, Communicator.Animation.NodeProperty.Opacity, sampler);

                this._channelMap.set(channelName, channel);
            }

            // Set node opacity
            channel.sampler.buffer.appendScalarKeyframe(startTime, this._nodeOpacities[nodeId]);
            channel.sampler.buffer.appendScalarKeyframe(startTime + duration, opacity);

            // Keep current opacity
            this._nodeOpacities[nodeId] = opacity;
        }
    }

    addVisibilityAnimation(nodes, startTime, duration, visible) {
        for (const nodeId of nodes) {
            // Get initial node visibility
            if (undefined == this._nodeVisibilities[nodeId]) {
                this._nodeVisibilities[nodeId] = this._viewer.model.getNodeVisibility(nodeId);
            }

            const channelName = `Visibility-${nodeId}`;

            // Get existing channel
            let channel = this._channelMap.get(channelName);

            if (!channel) {
                // Create a new channel
                const buffer = new Communicator.Animation.KeyframeBuffer(Communicator.Animation.KeyType.Scalar);
                const sampler = new Communicator.Animation.Sampler(buffer, Communicator.Animation.InterpolationType.Linear);
                channel = this._animation.createNodeChannel(channelName, nodeId, Communicator.Animation.NodeProperty.Visibility, sampler);

                this._channelMap.set(channelName, channel);
            }

            // Set node visibility
            channel.sampler.buffer.appendScalarKeyframe(startTime, this._nodeVisibilities[nodeId] ? 1.0 : 0.0);
            channel.sampler.buffer.appendScalarKeyframe(startTime + duration, visible ? 1.0 : 0.0);

            this._nodeOpacities[nodeId] = visible;
        }

    }

    async addFadeoutAnimation(nodes, startTime, duration) {
        for (const nodeId of nodes) {
            // Change node opacity to 0
            await this.addOpacityAnimation(nodes, startTime, duration, 0);

            // Hide node to enable selection behind objects
            await this.addVisibilityAnimation(nodes, startTime, duration, false);
        }
    }

    async addColorAnimation(nodes, startTime, duration, color) {
        for (const nodeId of nodes) {
            // Get initial node color
            if (undefined == this._nodeColors[nodeId]) {
                const children = this._viewer.model.getNodeChildren(nodeId);
                if (0 == children.length) {
                    const parentNode = this._viewer.model.getNodeParent(nodeId);
                    const color = await this._viewer.model.getNodesEffectiveFaceColor([parentNode]);
                    this._nodeColors[nodeId] = color[0];
                }
                else {
                    const color = await this._viewer.model.getNodesEffectiveFaceColor([nodeId]);
                    this._nodeColors[nodeId] = color[0];
                }
            }

            const channelName = `Color-${nodeId}`;

            // Get existing channel
            let channel = this._channelMap.get(channelName);

            if (!channel) {
                // Create a new channel
                const buffer = new Communicator.Animation.KeyframeBuffer(Communicator.Animation.KeyType.Vec3);
                const sampler = new Communicator.Animation.Sampler(buffer, Communicator.Animation.InterpolationType.Linear);
                channel = this._animation.createNodeChannel(channelName, nodeId, Communicator.Animation.NodeProperty.Color, sampler);

                this._channelMap.set(channelName, channel);
            }

            // Set node color
            channel.sampler.buffer.appendVec3Keyframe(startTime, this._nodeColors[nodeId].r, this._nodeColors[nodeId].g, this._nodeColors[nodeId].b);
            channel.sampler.buffer.appendVec3Keyframe(startTime + duration, color.r, color.g, color.b);

            // Keep current node color
            this._nodeColors[nodeId] = color;
        }
    }

    async addBlinkAnimation(nodes, startTime, duration, color) {
        for (const nodeId of nodes) {
            // Get initial node color
            if (undefined == this._nodeColors[nodeId]) {
                const children = this._viewer.model.getNodeChildren(nodeId);
                if (0 == children.length) {
                    const parentNode = this._viewer.model.getNodeParent(nodeId);
                    const color = await this._viewer.model.getNodesEffectiveFaceColor([parentNode]);
                    this._nodeColors[nodeId] = color[0];
                }
                else {
                    const color = await this._viewer.model.getNodesEffectiveFaceColor([nodeId]);
                    this._nodeColors[nodeId] = color[0];
                }
            }

            const channelName = `Color-${nodeId}`;

            // Get existing channel
            let channel = this._channelMap.get(channelName);

            if (!channel) {
                // Create a new channel
                const buffer = new Communicator.Animation.KeyframeBuffer(Communicator.Animation.KeyType.Vec3);
                const sampler = new Communicator.Animation.Sampler(buffer, Communicator.Animation.InterpolationType.Linear);
                channel = this._animation.createNodeChannel(channelName, nodeId, Communicator.Animation.NodeProperty.Color, sampler);

                this._channelMap.set(channelName, channel);
            }

            // Blink node by changing color
            for (let i = 0; i <= 6; i++) {
                const time = startTime + duration / 6 * i;
                if (i % 2 == 0) {
                    channel.sampler.buffer.appendVec3Keyframe(time, this._nodeColors[nodeId].r, this._nodeColors[nodeId].g, this._nodeColors[nodeId].b);
                }
                else {
                    channel.sampler.buffer.appendVec3Keyframe(time, color.r, color.g, color.b);
                }
            }
        }
    }
}