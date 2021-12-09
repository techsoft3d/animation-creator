class AnimationSteps {
    constructor(viewer, msgs, types) {
        this._viewer = viewer;
        this._msgs = msgs;
        this._types = types;
        this._homeCamera;
        this._steps = [];
        this._stepId = 0;
        this._groupId = 1;
        this._buttonId = 2;
        this._typeId = 3;
        this._nodesId = 4;
        this._directionId = 5;
        this._centerId = 6;
        this._distanceId = 7;
        this._startId = 8;
        this._durationId = 9;
        this._timelineId = 10;
        this._id = 0;
        this._currentGroupId = 0;
    }

    setHomeCamera(camera) {
        var json = camera.forJson();
        this._homeCamera = json;
    }
    
    getHomeCamera() {
        return this._homeCamera;
    }
    
    getTerminationTime() {
        var terminationTime = 0;
        var tbl = document.getElementById("stepTable");
        for (var i = 0; i < this._steps.length; i++) {
            var row = tbl.children[0].children[i + 1];
            var startTime = htmlspecialchars(row.cells[this._startId].getElementsByTagName("input")[0].value);
            if (isNaN(startTime))
                continue;
            var duration = htmlspecialchars(row.cells[this._durationId].getElementsByTagName("input")[0].value);
            if (isNaN(duration))
                continue;
            var endTime = Number(startTime) + Number(duration);
            if (terminationTime < endTime)
                terminationTime = endTime;
        }
        return terminationTime;
    }
    
    _addTableRow(start, duration, id, group) {
        var table = document.getElementById("stepTable");
        var row = table.insertRow(-1);
        row._id = id;
        var cells = [];
        for (var i = 0; i < (this._timelineId + 1); i++) {
            var cell = row.insertCell(-1);
            cell.className = "stepCell";
            cells.push(cell);
        }
        
        cells[this._stepId].innerHTML = id + 1;
        cells[this._stepId].className = "numberCell";
        if (undefined != group) {
            cells[this._groupId].innerHTML = group;
        }
        cells[this._groupId].className = "numberCell";
        cells[this._buttonId].innerHTML = '<input class="tableBtn" type="image" title="Delete" src="css/images/delete.png" onclick="deleteRow(this)" />';
        cells[this._buttonId].align = "center";
        cells[this._directionId].align = "center";
        cells[this._centerId].align = "center";
        cells[this._startId].innerHTML = '<input class="tableInput" id="start' + id + '" type="number" step="0.5" value="' + start + '" onChange="changeStart(this)" />';
        cells[this._durationId].innerHTML = '<input class="tableInput" id="duration' + id + '" type="number" step="0.5" value="' + String(duration) + '" onChange="changeDuration(this)" />';
        cells[this._timelineId].innerHTML = '<div class="slider" id="slider' + id + '"></div>';
        $("#slider" + id).slider({
            min: 0,
            max: 10,
            step: 0.5,
            range: true,
            values: [start, start + duration],
            change: function(e, ui) {
              $('#start' + id).val(ui.values[0]);
              $('#duration' + id).val(ui.values[1] - ui.values[0]);
            },
        });
       
        return cells;
    }
    
    addCameraStep(camera) {
        const start = this.getTerminationTime();
        const duration = 0.5;

        var json = camera.forJson();
        var step = {
            type: "camera",
            camera: json,
            startTime: start * 1000,
            duration: duration * 500
        }
        this._steps.push(step);

        // Update table
        var cells = this._addTableRow(start, 0.5, this._id++);
        cells[this._typeId].innerHTML = this._types[0];
    }

    addTranslationStep(nodes, vector, distance, start, duration, startPoints) {
        var step = {
            type: "translation",
            nodes: nodes.concat(),
            vector: vector,
            distance: distance,
            startTime: start * 1000,
            duration: duration * 1000,
            guideStartPoints: startPoints
        }
        
        // Set group ID
        let group;
        if (this._currentGroupId) {
            group = this._currentGroupId;
            step.group = this._currentGroupId;
        }

        this._steps.push(step);

        // Update table
        var cells = this._addTableRow(start, duration, this._id++, group);
        cells[this._typeId].innerHTML = this._types[1];
        cells[this._nodesId].innerHTML = JSON.stringify(nodes);
        var str = JSON.stringify(vector);
        cells[this._directionId].innerHTML = '<input class="tableBtn" type="image" title=' + str + ' src="css/images/dir.png" onclick="changeXYZ(this,\'vector\')" />';
        cells[this._distanceId].innerHTML = '<input class="tableInput" type="number" value="' + String(distance) + '">';
    }
    
    addRotationStep(nodes, axis, center, angle, start, duration) {
        var step = {
            type: "rotation",
            nodes: nodes.concat(),
            axsis: axis,
            center: center,
            angle: angle,
            startTime: start * 1000,
            duration: duration * 1000
        }
        this._steps.push(step);
        
        var cells = this._addTableRow(start, duration, this._id++);
        cells[this._typeId].innerHTML = this._types[2];
        cells[this._nodesId].innerHTML = JSON.stringify(nodes);
        var str = JSON.stringify(axis);
        cells[this._directionId].innerHTML = '<input class="tableBtn" type="image" title=' + str + ' src="css/images/dir.png" onclick="changeXYZ(this,\'axsis\')" />';
        str = JSON.stringify(center);
        cells[this._centerId].innerHTML = '<input class="tableBtn" type="image" title=' + str + ' src="css/images/center.png" onclick="changeXYZ(this,\'center\')" />';
        cells[this._distanceId].innerHTML = '<input class="tableInput" type="number" value="' + String(angle) + '" >';
    }
    
    addHideNodesStep(nodes) {
        var terminationTime = this.getTerminationTime();
        var step = {
            type: "hideNodes",
            nodes: nodes,
            startTime: terminationTime * 1000,
            duration: 500
        }
        this._steps.push(step);
        
        var cells = this._addTableRow(terminationTime, 0.5, this._id++);
        cells[this._typeId].innerHTML = this._types[3];
        cells[this._nodesId].innerHTML = JSON.stringify(nodes);
    }
    
    addBlinkNodesStep(nodes) {
        const terminationTime = this.getTerminationTime();
        var step = {
            type: "blinkNodes",
            nodes: nodes,
            startTime: terminationTime * 1000,
            duration: 500
        }
        this._steps.push(step);
        
        var cells = this._addTableRow(terminationTime, 1.0, this._id++);
        cells[this._typeId].innerHTML = this._types[4];
        cells[this._nodesId].innerHTML = JSON.stringify(nodes);
    }

    deleteStep(id) {
        this._steps.splice(id, 1);
    }
    
    startGroup() {
        // Get max group ID
        let groupId = 0;
        for (let step of this._steps) {
            if (undefined != step.group) {
                if (groupId < step.group) {
                    groupId = step.group
                }
            }
        }
        groupId++;
        this._currentGroupId = groupId;
    }

    stopGroup() {
        this._currentGroupId = 0;
    }

    update() {
        var tbl = document.getElementById("stepTable");
        var tbl = document.getElementById("stepTable");
        for (var i = 0; i < this._steps.length; i++) {
            var step = this._steps[i];
            var row = tbl.children[0].children[i + 1];
            
            if (step.type == "translation") {
                var distance = htmlspecialchars(row.cells[this._distanceId].getElementsByTagName("input")[0].value);
                if (isNaN(distance)) {
                    alert(this._msgs[0] + String(i + 1));
                    return false;
                }
                step.distance = Number(distance);
            } else if (step.type == "rotation") {
                var angle = htmlspecialchars(row.cells[this._distanceId].getElementsByTagName("input")[0].value);
                if (isNaN(angle)) {
                    alert(this._msgs[0] + String(i + 1));
                    return false;
                }
                step.angle = Number(angle);
            }
            
            var startTime = htmlspecialchars(row.cells[this._startId].getElementsByTagName("input")[0].value);
            if (isNaN(startTime)) {
                alert(this._msgs[1] + String(i + 1));
                return false;
            }
            step.startTime = Number(startTime * 1000);
            
            var duration = htmlspecialchars(row.cells[this._durationId].getElementsByTagName("input")[0].value);
            if (isNaN(duration)) {
                alert(this._msgs[2] + String(i + 1));
                return false;
            }
            step.duration = Math.round(Number(duration * 1000));
        }
        return true;
    }
    
    save() {
        return new Promise((resolve, reject) => {
            this.update();
            
            var data = {
                homeCamera: this._homeCamera,
                steps: this._steps
            }
            var str = JSON.stringify(data);
            exportAsJson(str, "../../animation_creator/jsons/" + modelName + ".json").then(function(){
                resolve();
            });
        });
    }
    
    createScript() {
        return new Promise((resolve, reject) => {
            this.update();
            
            var steps = JSON.stringify(this._steps);
            var camera = JSON.stringify(this._homeCamera);
            var str = 
                "    _animationSteps = new AnimationSteps();\n" + 
                "    var steps = JSON.parse('" + steps + "');\n" + 
                "    _animationSteps.setSteps(steps);\n" +
                "\n" +
                "    var camera = JSON.parse('" + camera + "');\n" +
                "    var homeCamera = new Communicator.Camera.construct(camera)\n" +
                "    _animationSteps.setHomeCamera(homeCamera);\n" + 
                "\n" +
                "    _animationController = new AnimationController(hwv, _animationSteps);"
            exportAsJson(str, "../../animation_creator/createHtml/template/script_custom_before_start_viewer.js").then(() => {
                resolve();
            });
        }); 
    }
    
    getSteps() {
        return this._steps;
    }
    
    setSteps(steps) {
        this._steps = steps;
    }
    
    listSteps() {
        var table = document.getElementById("stepTable");
        var len = table.rows.length;
        for(var i = 1; i < len; i++) {
            var rows = table.deleteRow(1);
        }
        
        this._id = 0;
        
        for (var i = 0; i < this._steps.length; i++) {
            var step = this._steps[i];
            var start = step.startTime / 1000;
            var duration = step.duration / 1000;
            var group = step.group;
            var cells = this._addTableRow(start, duration, this._id++, group);
            switch(step.type) {
                case "camera":
                    cells[this._typeId].innerHTML = this._types[0];
                    break;
                case "translation":
                    cells[this._typeId].innerHTML = this._types[1];
                    cells[this._nodesId].innerHTML = JSON.stringify(step.nodes);
                    var str = JSON.stringify(step.vector);
                    cells[this._directionId].innerHTML = '<input class="tableBtn" type="image" title=' + str + ' src="css/images/dir.png" onclick="changeXYZ(this,\'vector\')" />';
                    cells[this._distanceId].innerHTML = '<input class="tableInput" type="number" value="' + String(step.distance) + '">';
                    break;
                case "rotation":
                    cells[this._typeId].innerHTML = this._types[2];
                    cells[this._nodesId].innerHTML = JSON.stringify(step.nodes);
                    var str = JSON.stringify(step.axsis);
                    cells[this._directionId].innerHTML = '<input class="tableBtn" type="image" title=' + str + ' src="css/images/dir.png" onclick="changeXYZ(this,\'axsis\')" />';
                    str = JSON.stringify(step.center);
                    cells[this._centerId].innerHTML = '<input class="tableBtn" type="image" title=' + str + ' src="css/images/center.png" onclick="changeXYZ(this,\'center\')" />';
                    cells[this._distanceId].innerHTML = '<input class="tableInput" type="number" value="' + String(step.angle) + '">';
                    break;
                case "hideNodes":
                    cells[this._typeId].innerHTML = this._types[3];
                    cells[this._nodesId].innerHTML = JSON.stringify(step.nodes);
                    break;
                case "blinkNodes":
                    cells[this._typeId].innerHTML = this._types[4];
                    cells[this._nodesId].innerHTML = JSON.stringify(step.nodes);
                    break;
            }
        }
    }
}

function deleteRow(obj) {
    var tr = obj.parentNode.parentNode;
    
    var stepId = tr.sectionRowIndex - 1;
    mainViewer._animationSteps.deleteStep(stepId);
    
    mainViewer._animationSteps.listSteps();
}

function changeStart(obj) {
    var val1 = htmlspecialchars(obj.value);
    if (isNaN(val1))
        return;
    val1 = Number(val1);
    var row = obj.parentNode.parentNode;
    var id = row._id;
    var vals = $("#slider" + id).slider("values");
    var val2 = val1 + vals[1] - vals[0];
    $("#slider" + id).slider("values", [val1, val2]);
}

function changeDuration(obj) {
    var val = htmlspecialchars(obj.value);
    if (isNaN(val))
        return;
    val = Number(val);
    var row = obj.parentNode.parentNode;
    var id = row._id;
    var vals = $("#slider" + id).slider("values");
    $("#slider" + id).slider("values", [vals[0], vals[0] + val]);
}

function changeXYZ(obj, element) {
    targetBtn = obj;
    var tr = obj.parentNode.parentNode;
    
    var stepId = tr.sectionRowIndex - 1;
    var steps = mainViewer._animationSteps.getSteps();
    targetXYZ = steps[stepId][element];
    $("#dlgX").val(String(targetXYZ.x));
    $("#dlgY").val(String(targetXYZ.y));
    $("#dlgZ").val(String(targetXYZ.z));
    $('#XYZDlg').dialog('open');
}