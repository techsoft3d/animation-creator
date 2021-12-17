class assemblyGuideLine {
    constructor(viewer, stPntArr, vector, time, distance, interval) {
        this._viewer = viewer;
        this._stPntArr = stPntArr;
        this._vector = vector.copy();
        this._distance = distance;
        this._isCollapse = false;

        const stepDistance = distance / time * interval;
        this._stepIncPnt = this._vector.copy().scale(stepDistance);
        this._stepCount = time / interval;

        this._meshInstanceIds = [];

        // Create markup line instance at start points
        this._markupLineArr = [];
        this._markupGuidArr = [];
        this._createMakeupLines();
    }

    _createMakeupLines() {
        for (let stPnt of this._stPntArr) {
            let markupItem = new lineMarkup(this._viewer, stPnt);
            this._markupLineArr.push(markupItem);
        }
    }

    _registerMarkupLines() {
        for (let markupItem of this._markupLineArr) {
            let guid = this._viewer.markupManager.registerMarkup(markupItem);
            this._markupGuidArr.push(guid);
        }
    }

    _hideMarkers() {
        for (let guid of this._markupGuidArr) {
            this._viewer.markupManager.unregisterMarkup(guid);
        }
        this._markupGuidArr.length = 0;
    }

    _createGuidePolyLines() {
        let promiseArr = [];
        for (let stPnt of this._stPntArr) {
            const vertices = [stPnt.x, stPnt.y, stPnt.z,
                stPnt.x + this._vector.x * this._distance, 
                stPnt.y + this._vector.y * this._distance, 
                stPnt.z + this._vector.z * this._distance] 

            let meshData = new Communicator.MeshData();
            meshData.addPolyline(vertices);
            promiseArr.push(this._viewer.model.createMesh(meshData));
        }
        
        Promise.all(promiseArr).then((meshIdArr)=> {
            promiseArr.length = 0;

            const lineColor = new Communicator.Color(128, 128, 128);
            let flags = Communicator.MeshInstanceCreationFlags.DoNotOutlineHighlight |
            Communicator.MeshInstanceCreationFlags.ExcludeBounding |
            Communicator.MeshInstanceCreationFlags.DoNotCut |
            Communicator.MeshInstanceCreationFlags.DoNotExplode |
            Communicator.MeshInstanceCreationFlags.DoNotLight |
            Communicator.MeshInstanceCreationFlags.DoNotSelect;
            for (let meshId of meshIdArr) {
                let meshInstanceData = new Communicator.MeshInstanceData(meshId, null, "ground_line", null, lineColor, null, flags);
                promiseArr.push(this._viewer.model.createMeshInstance(meshInstanceData));
            }

            Promise.all(promiseArr).then((instacdIdArr)=> {
                for (let instacdId of instacdIdArr) {
                    this._meshInstanceIds.push(instacdId);
                }
            });
        })
    }

    // It needs to be set true when you involve collapse animation
    // (In default, it is false for explosion animatio)
    setCollapseMode(isCollapse) {
        this._isCollapse = isCollapse;
    }

    // It needs to be call before starting animation
    animationStart() {
        this._registerMarkupLines();

        if (this._isCollapse) {
            this.removeGuidePolylines();
        }
    }

    // It needs to be call after animation
    animationEnd() {
        this._hideMarkers();

        if (!this._isCollapse) {
            this._createGuidePolyLines();
            
            // Initialize markup lines to shorten
            for (let markupItem of this._markupLineArr) {
                markupItem.initEndPoint();
            }
        }
    }

    // It updates assembly guideline dynamically while animation
    animationIncrement(count) {
        let step = count;

        if (this._isCollapse) {
            step = this._stepCount - step;
        }

        let incPnt = this._stepIncPnt.copy().scale(step);
        for (let lineMkp of this._markupLineArr) {
            lineMkp.setEndPoint(incPnt);
        }
        this._viewer.markupManager.refreshMarkup();
    }
    
    removeGuidePolyline(id) {
        return new Promise((resolve, reject) => {
            this._viewer.model.deleteMeshInstances([this._meshInstanceIds[id]]).then(()=> {
                this._meshInstanceIds.splice(id, 1);
                resolve();
            });
        });
    }

    removeGuidePolylines() {
        return new Promise((resolve, reject) => {
            if (0 < this._meshInstanceIds.length) {
                this._viewer.model.deleteMeshInstances(this._meshInstanceIds).then(()=> {
                    this._meshInstanceIds.length = 0;
                });
            }
            else {
                resolve();
            }
        });
    }
}

// This is sub class to draw guide lines in Markup lines dynamically while animation
class lineMarkup extends Communicator.Markup.MarkupItem {
    constructor(viewer, stPnt) {
        super();
        this._viewer = viewer;
        this._stPnt = stPnt.copy();
        this._enPnt = stPnt.copy();
        
        let stPnt2 = Communicator.Point2.fromPoint3(this._viewer.view.projectPoint(this._stPnt));
        let enPnt2 = Communicator.Point2.fromPoint3(this._viewer.view.projectPoint(this._enPnt));
        this._line = new Communicator.Markup.Shape.Line(stPnt2, enPnt2);
        this._line.setStrokeColor(new Communicator.Color(255, 255, 0));
        this._line.setStrokeWidth(2);
    }

    setEndPoint(incPnt) {
        this._enPnt = this._stPnt.copy().add(incPnt);
    }

    initEndPoint() {
        this._enPnt = this._stPnt.copy();
    }

    draw() {
        let stPnt2 = Communicator.Point2.fromPoint3(this._viewer.view.projectPoint(this._stPnt));
        let enPnt2 = Communicator.Point2.fromPoint3(this._viewer.view.projectPoint(this._enPnt));
        this._line.set(stPnt2, enPnt2);
        this._viewer.markupManager.getRenderer().drawLine(this._line);                
    }


    hit() {
        return false;
    }

    remove () {
    }
}