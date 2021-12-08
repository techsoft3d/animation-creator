function animation_creator (language) {
    this._resource = new SetResources(language);
    this._msgs = this._resource.getMsgs();
    this._labels = this._resource.getLabels();
    this._viewer;
    this._animationController;
    this._animationSteps;
    this._homeCamera;
    this._handleOp;
    this._handleOpHandel;
    this._nodesSelOp;
    this._nodesSelOpHandle;
    this._pointSelOp;
    this._pointSelOpHandle;
    this._handleOpOp;
    this._handleOpOpHandle;
    this._myHandleOp;    
    this._myHandleOpHandle;    
    this._vectorSelOp;
    this._vectorSelOpHandle;
    this._isNodesSelection = false;
    this._isNodesHandleSelection = false;
    this._lineHighlightedNodes = [];
    this._vector;
    this._previewArrow;
    this._dlOptions = {};
    this._jstree;
    this._modelName;
    this._extension;
}

animation_creator.prototype.start = function (viewerMode, modelName, reverseProxy, extension) {
    var _this = this;
    _this._modelName = modelName;
    _this._extension = extension;
    _this._initEvents();
    _this._createViewer(viewerMode, modelName, reverseProxy);
}

animation_creator.prototype._initEvents = function () {
    var _this = this;
    
    $('#container').resizable({
        minHeight: 330,
        minWidth: 400
    });
    
    $('#targetNodes').change(function() {
        function getBodyNodes(node, model, nodes) {
            var children = model.getNodeChildren(node);
            if (!children.length) {
                nodes.push(node);
                return;
            }
            for (var i = 0; i < children.length; i++) {
                getBodyNodes(children[i], model, nodes);
            }            
        }
        
        _this.resetLineHighlighted();
        
        var model = _this._viewer.model;
        var nodes = [];
        nodes.length = 0;
        var nodeId = Number($(this).val());
        getBodyNodes(nodeId, model, nodes);
        for (var i = 0; i < nodes.length; i++) {
            getEdgeCnt(model, nodes[i]).then(function(obj) {
                for (var j = 0; j < obj.count; j++) {
                    model.setNodeLineHighlighted(obj.node, j, true);
                }                
            });
        }
        _this._lineHighlightedNodes = nodes.concat();
    });
    
    var winHeight = $(window).innerHeight();
    var toolbarHeight = $("#cmdBtns").height();
    var footerHeight = $("#footer").height();
    
    var h = winHeight - 12 - toolbarHeight - footerHeight;
    if(580 < h) {
        $('#container').height(h - 180);
    }
    
    var winW = $(window).width() - 4;
    if(600 < winW) {
        var treeW = winW / 6 * 2;
        if(300 < treeW)
            $('#container').width(winW - 300);
        else
            $('#container').width(winW / 6 * 4);
    }
    
    var resizeTimer;
    var interval = Math.floor(1000 / 60 * 10);
    $(window).resize(function() {
      if (resizeTimer !== false) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(function () {
        layoutPage()
        _this._viewer.resizeCanvas();
      }, interval);
    });
    
    layoutPage();
    function layoutPage () {
        var winHeight = $(window).height();
        var winWidth = $(window).innerWidth();
        var toolbarHeight = $("#cmdBtns").height();
        var footerHeight = $("#footer").height();
        var conOffset = $("#container").offset();
        var conHeight = $('#container').innerHeight();
        var conWidth = $('#container').innerWidth();
        
        $("#animateBtns").offset({ 
            top: conOffset.top + conHeight - 40, 
            left: conOffset.left + (conWidth - $("#animateBtns").width()) / 2 
        });
        
        $("#versionInfo").offset({ 
            top: conOffset.top + conHeight - 20, 
            left: conOffset.left + conWidth - $("#versionInfo").width() - 10
        });
        
        $("#stepMainteBtns").offset({
            top: conOffset.top + conHeight - 40,
            left: 2
        });
        
        $("#modelTree").offset({
            top: conOffset.top + 5,
            left: conOffset.left + conWidth + 5
        })
            .height(conHeight - 10)
            .width(winWidth - conWidth - 10);
        
        var stepHeight = winHeight - 12 - toolbarHeight - conHeight - footerHeight;
        if (180 < stepHeight);
            $("#stepContainer").height(stepHeight);
        
        $(".commandDlg").offset({
            top: conOffset.top + 5,
            left: conOffset.left + 5
        });
    }
    
    function resetOperator() {
        var OM = _this._viewer.operatorManager;
        OM.clear();
        OM.push(Communicator.OperatorId.Navigate);
        OM.push(Communicator.OperatorId.Select);
        OM.push(Communicator.OperatorId.Cutting);
        OM.push(Communicator.OperatorId.Handle);
        OM.push(Communicator.OperatorId.NavCube);
    }
    
    function resetCommand() {
        $("#targetNodes").val("");
        $("#point").val("");
        $(".commandDlg").hide();

        _this._isNodesSelection = false;
        _this._isNodesHandleSelection = false;
        _this._nodesSelOp.reset();
        _this._pointSelOp.reset();
        resetOperator();
        
        $('.toolbarBtn').data("on", false).css("background-color", "gainsboro");
        
        _this.resetLineHighlighted();
        
        if (_this._previewArrow != undefined) {
            _this._viewer.getMarkupManager().unregisterMarkup(_this._previewArrow);
            _this._previewArrow = undefined
        }

        _this._myHandleOp.removeHandles();
    }
    
    function selectionArrayFunc(selectionEvents) {
        if (0 == selectionEvents.length) {
            return;
        }
        
        // Show handle
        const selectionEvent = selectionEvents.pop();
        const selectionType = selectionEvent.getType();
        if (selectionType != Communicator.SelectionType.None) {
            const selection = selectionEvent.getSelection();
            const selectedNode = selection.getNodeId();

            // Show handle
            _this._handleOpOp.addHandle(selectedNode);
        }
    }

    $(".toolbarBtn").on({
        "click": async function() {
            var command = $(this).data("command");
            var nodes = [];
            
            if ($('.toolbarBtn[data-command="translate"]').data("on")) {
                $('.toolbarBtn[data-command="translate"]').data("on", false).css("background-color", "gainsboro");
                resetCommand();
                if (command == "translate")
                    return;
            } else if ($('.toolbarBtn[data-command="handTranslate"]').data("on")) {
                $('.toolbarBtn[data-command="handTranslate"]').data("on", false).css("background-color", "gainsboro");
                resetCommand();
                _this._viewer.unsetCallbacks({ selectionArray: selectionArrayFunc });

                if (command == "handTranslate")
                    return;
            } else if ($('.toolbarBtn[data-command="rotate"]').data("on")) {
                $('.toolbarBtn[data-command="rotate"]').data("on", false).css("background-color", "gainsboro");
                resetCommand();
                if (command == "rotate")
                    return;
            }
            
            switch (command) {
                case "home":
                    _this._homeCamera = _this._viewer.view.getCamera();
                    _this._animationSteps.setHomeCamera(_this._homeCamera);
                    break;
                case "camera":
                    var camera = _this._viewer.view.getCamera();
                    _this._animationSteps.addCameraStep(camera);
                    break;
                case "translate":
                    $(this).data("on", true).css("background-color", "floralWhite");
                    
                    $("#lblAxis").text(_this._labels.dir);
                    var s = _this._animationSteps.getTerminationTime();
                    $('input[name=axis]').val(['X']);
                    $("#start").val(s);
                    $("#centerPoint").hide();
                    $("#translateDistance").show();
                    $("#rotateAngle").hide();
                    $("#btnOK").data("command", "translate");
                    $("#translateDlg").show();
                    $("#targetNodes").focus();
                    break;
                case "handTranslate":
                    $(this).data("on", true).css("background-color", "floralWhite");

                    _this._viewer.operatorManager.push(_this._handleOpOpHandle);;
                    _this._viewer.setCallbacks({ selectionArray: selectionArrayFunc });

                    // Set myHandleOp
                    const id = _this._viewer.operatorManager.indexOf(Communicator.OperatorId.Handle);
                    if (-1 != id) {
                        _this._viewer.operatorManager.set(_this._myHandleOpHandle, id);
                    }
                    else {
                        viewer.operatorManager.push(_this._myHandleOpHandle)
                    }

                    _this._isNodesHandleSelection = true
                    break;
                case "rotate":
                    $(this).data("on", true).css("background-color", "floralWhite");
                    
                    $("#lblAxis").text(_this._labels.roAxis);
                    $("#lblCenter").text(_this._labels.roCenter);
                    var s = _this._animationSteps.getTerminationTime();
                    $('input[name=axis]').val(['X']);
                    $("#start").val(s);
                    $("#centerPoint").show();
                    $("#translateDistance").hide();
                    $("#rotateAngle").show();
                    $("#btnOK").data("command", "rotate");
                    $("#translateDlg").show();
                    $("#targetNodes").focus();
                    break;
                case "hide":
                    if (nodes.length == 0) {
                        var selections = _this._viewer.selectionManager.getResults();
                        if (selections.length == 0)
                            return;
                        for (var i = 0; i < selections.length; i++) {
                            var selItem = selections[i];
                            nodes.push(selItem.getNodeId());
                        }
                    }
                    _this._animationSteps.addHideNodesStep(nodes);
                    break;
                case "blink":
                    if (nodes.length == 0) {
                        const selections = _this._viewer.selectionManager.getResults();
                        if (0 == selections.length)
                            return;
                        for (let selItem of selections) {
                            nodes.push(selItem.getNodeId());
                        }
                    }
                    _this._animationSteps.addBlinkNodesStep(nodes);
                    break;
                case "reorder":
                    _this._animationSteps.update();
                    var steps = _this._animationSteps.getSteps();
                    steps.sort(function(a,b){
                        if(a.startTime<b.startTime) return -1;
                        if(a.startTime > b.startTime) return 1;
                        return 0;
                    });
                    _this._animationSteps.listSteps();
                    break;
                case "save":
                    _this._animationSteps.update();
                    _this._animationSteps.save();
                    break;
                case "download":
                    let cameraObj;
                    if (undefined != _this._homeCamera) {
                        cameraObj = _this._homeCamera.toJson();
                    }

                    const animationObj = await _this._animationController.serialize();
                    const obj = {
                        homeCamera: cameraObj,
                        animation: animationObj
                    }

                    $('#animationJson').val(JSON.stringify(obj));
                    $('#dlOptionsDlg').dialog('open');

                    break;
           };
        },
        "mousedown": function() {
            $(this).css("background-color", "floralWhite");
        },
        "mouseup": function() {
            $(this).css("background-color", "gainsboro");
        }
    });
    
    var url = "../common/jQuery-File-Upload/php/up.php";
    $('#fileupload').fileupload({
        url: url,
        dataType: 'json',
        done: function (e, data) {
            $.each(data.result.files, function (index, file) {
                $('<p/>').text(file.name).appendTo('#files');
            });
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );
        }
    }).prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');

    $(".tableBtn").on({
        "mousedown": function() {
            $(this).css("background-color", "floralWhite");
        },
        "mouseup": function() {
            $(this).css("background-color", "gainsboro");
        }
    });
    
    $("#targetNodes").on({
        "focus": function() {
            $(this).css("background-color", "#FF8080");
            if (_this._nodesSelOp.getNodes().length == 0) {
                $('select#targetNodes option').remove();
                $option = $('<option>')
                    .val('')
                    .text(_this._msgs[9])
                    .prop('disabled', true);
                $("#targetNodes").append($option);
            }
            _this._isNodesSelection = true;
            $("#point").css("background-color", "#FFFFFF");
            $("#point").attr("placeholder", "");
            var OM = _this._viewer.operatorManager;
            OM.clear();
            OM.push(Communicator.OperatorId.Navigate);
            OM.push(Communicator.OperatorId.Cutting);
            OM.push(Communicator.OperatorId.Handle);
            OM.push(Communicator.OperatorId.NavCube);
            OM.push(_this._nodesSelOpHandle);
        },
        "focusout": function() {
            _this.resetLineHighlighted();
            this.selectedIndex  = -1;
        }
    });
    
    $("#point").on("focus", function() {
        $("#targetNodes").css("background-color", "#FFFFFF");
        if (_this._nodesSelOp.getNodes().length == 0) {
            $('select#targetNodes option').remove();
        }
        _this._isNodesSelection = false;
        $(this).css("background-color", "#FF8080");
        $(this).attr("placeholder", _this._msgs[10]);
        var OM = _this._viewer.operatorManager;
        OM.clear();
        OM.push(Communicator.OperatorId.Navigate);
        OM.push(Communicator.OperatorId.Cutting);
        OM.push(Communicator.OperatorId.Handle);
        OM.push(Communicator.OperatorId.NavCube);
        OM.push(_this._pointSelOpHandle);
    });    
    
    $("#btnCancel").on("click", function() {
        resetCommand();
    });
    
    $('input[name="axis"]:radio').change( function() {  
        var a = $(this).val();
        if (a == "C") {
            $("#targetNodes").css("background-color", "#FFFFFF");
            if (_this._nodesSelOp.getNodes().length == 0) {
                $('select#targetNodes option').remove();
            }
           _this._isNodesSelection = false;

            $("#point").css("background-color", "#FFFFFF");
            $("#point").attr("placeholder", "");

            var OM = _this._viewer.operatorManager;
            OM.clear();
            OM.push(Communicator.OperatorId.Navigate);
            OM.push(Communicator.OperatorId.Cutting);
            OM.push(Communicator.OperatorId.Handle);
            OM.push(Communicator.OperatorId.NavCube);
            OM.push(_this._vectorSelOpHandle);
        } else {
            _this.showPreview();
        }
    }); 
    
    $(".preview").on({
        "change": function() {
            _this.showPreview();
        }
    })
    
    $("#btnOK").on("click", function() {
        var command = $(this).data("command");
        
        var nodes = _this._nodesSelOp.getNodes();
        if (nodes.length == 0) {
            alert(_this._msgs[3]);
            $("#targetNodes").focus();
            return;
        }
            
        var a = $('input[name=axis]:checked').val();
        var axis;
        switch(a) {
            case "X":
                axis = new Communicator.Point3(1, 0, 0);
                break;
            case "Y":
                axis = new Communicator.Point3(0, 1, 0);
                break;
            case "Z":
                axis = new Communicator.Point3(0, 0, 1);
                break;
            case "C":
                axis = _this._vector;
        };
        
        
        var start = $("#start").val();
        if (isNaN(start)) {
            alert(_this._msgs[7]);
            $("#start").focus();
            return;
        }
        start = Number(start);
        
        var duration = $("#duration").val();
        if (isNaN(duration)) {
            alert(_this._msgs[8]);
            $("#duration").focus();
            return;
        }
        duration = Number(duration);
        
        switch (command) {
            case "translate":
                var distance = $("#distance").val();
                if (isNaN(distance)) {
                    alert(_this._msgs[5]);
                    $("#distance").focus();
                    return;
                }
                distance = Number(distance);
                
               _this._animationSteps.addTranslationStep(nodes, axis, distance, start, duration);
                break;
            case "rotate":
                var center = _this._pointSelOp.getPoint();
                if (center == undefined) {
                    alert(_this._msgs[4]);
                    $("#point").focus();
                    return;
                }
                
                var angle = $("#angle").val();
                if (isNaN(angle)) {
                    alert(_this._msgs[5]);
                    $("#angle").focus();
                    return;
                }
                angle = Number(angle);
                
               _this._animationSteps.addRotationStep(nodes, axis, center, angle, start, duration);
                break;
        };
        
        resetCommand();
    });
    
    $(".animateBtn").on("click", function() {
        var command = $(this).data("command");
        switch (command) {
            case "rewind":
                resetCommand();
                _this._handleOpOp.rewind();
                _this._animationController.rewind();
                break;
            case "play":
                _this._handleOpOp.rewind();
                if (_this._animationSteps.update()) {
                    _this._animationController.play();
                }
                break;
            case "pause":
                _this._animationController.pause();
                break;
        };
    });
   
    $("#XYZDlg").dialog({
        autoOpen: false,
        height: 300,
        width: 240,
        modal: true,
        title: "XYZ",
        closeOnEscape: true,
        position: {my: "center", at: "center", of: window},
        buttons: {
            'OK': function(){
                var x = $("#dlgX").val();
                if (isNaN(x)) {
                    alert("X" + _this._msgs[6]);
                    return;
                }
                var y = $("#dlgY").val();
                if (isNaN(y)) {
                    alert("Y" + _this._msgs[6]);
                    return;
                }
                var z = $("#dlgZ").val();
                if (isNaN(z)) {
                    alert("Z" + _this._msgs[6]);
                    return;
                }
                targetXYZ.x = Number(x);
                targetXYZ.y = Number(y);
                targetXYZ.z = Number(z);
                
                targetBtn.title = JSON.stringify(targetXYZ);
                
                $(this).dialog('close');
            },
            'Cancel': function(){
                $(this).dialog('close');
            }
        }
    });
    
    $("#dlOp_std").change(function() {
        if ($(this).prop('checked')) {
            $("#dlOp_toolbar").prop('checked', false);
            $("#dlOp_triad").prop('checked', false);
            $("#dlOp_cube").prop('checked', false);
        }
    })
    
    $("#dlOp_toolbar").change(function() {
        if ($(this).prop('checked')) {
            $("#dlOp_std").prop('checked', false);
        }
    })
    
    $("#dlOp_triad").change(function() {
        if ($(this).prop('checked')) {
            $("#dlOp_std").prop('checked', false);
        }
    })
    
    $("#dlOp_cube").change(function() {
        if ($(this).prop('checked')) {
            $("#dlOp_std").prop('checked', false);
        }
    })
    
    $("#dlOptionsDlg").dialog({
        autoOpen: false,
        height: 400,
        width: 600,
        modal: true,
        title: "Serialized animation",
        closeOnEscape: true,
        position: {my: "center", at: "center", of: window},
        buttons: {
            'Close': function(){
                $(this).dialog('close');
            },
        }
    });

    $('#tree1').on({
        'hover_node.jstree': (event, obj)=> {
            let nodeId = Number(obj.node.id);
            _this._viewer.model.resetNodesColor();
            _this._viewer.model.setNodesFaceColor([nodeId], new Communicator.Color(255, 0, 0));           
        },
        'dehover_node.jstree': ()=> {
            _this._viewer.model.resetNodesColor();
        },
        'select_node.jstree': function(event, obj) {
            var id = Number(obj.node.id);
            var key_event = event || window.event;
            // var key_ctrl = (key_event.ctrlKey);
            var key_ctrl = obj.event.originalEvent.ctrlKey;
            _this.highlightNode(id, key_ctrl);
        }
    });
}
    
animation_creator.prototype._createViewer = function (viewerMode, modelName, reverseProxy) {
    var _this = this;
    createViewer(viewerMode, modelName, "container", reverseProxy).then(function (hwv) {
        _this._viewer = hwv;
        
        function sceneReadyFunc() {
            // Show Triad
            var axisTriad = _this._viewer.view.getAxisTriad();
            axisTriad.setAnchor(Communicator.OverlayAnchor.LowerRightCorner);
            axisTriad.enable();

            // Get viewer virsion
            var varStr = _this._viewer.getViewerVersionString()
            $("#versionInfo").html(varStr);
            
            var conOffset = $("#container").offset();
            var conWidth = $('#container').innerWidth();
            $("#versionInfo").offset({ 
                left: conOffset.left + conWidth - $("#versionInfo").width() - 10
            });
        }
        
        function modelStructureReadyFunc() {
            var model = _this._viewer.model;

            // create tree
            _this._jstree = new JstreeTree(model, '#tree1');
            _this._jstree.createTreeFromCurrentModel();
            
            LoadStepData(modelName).then(function(data) {
                var steps = data.steps;
                if(steps.length) {
                    _this._animationSteps.setSteps(steps);
                    _this._animationSteps.listSteps();
                }
                var camera = data.homeCamera;
                if(camera != undefined) {
                    _this._homeCamera = new Communicator.Camera.construct(camera)
                    _this._animationSteps.setHomeCamera(_this._homeCamera);
                }
            });
        }
        
        _this._viewer.setCallbacks({
            sceneReady: sceneReadyFunc,
            modelStructureReady: modelStructureReadyFunc,
        });
        
        _this._animationSteps = new AnimationSteps(_this._viewer, _this._resource.getMsgs(), _this._resource.getTypes());
        _this._animationController = new AnimationController(_this._viewer, _this._animationSteps);
        
        _this._handleOp = new HandleOperator(_this._viewer, _this._animationSteps);
        _this._handleOpHandel = _this._viewer.operatorManager.registerCustomOperator(_this._handleOp);
        
        _this._nodesSelOp = new NodesSelectOperator(_this._viewer, _this._resource.getMsgs());
        _this._nodesSelOpHandle = _this._viewer.operatorManager.registerCustomOperator(_this._nodesSelOp);
        
        _this._vectorSelOp = new VectorSelectOperator(_this._viewer);
        _this._vectorSelOpHandle = _this._viewer.operatorManager.registerCustomOperator(_this._vectorSelOp);
        
        _this._pointSelOp = new PointSelectOperator(_this._viewer);
        _this._pointSelOpHandle = _this._viewer.operatorManager.registerCustomOperator(_this._pointSelOp);
        
        // Register myHandleOperator
        _this._myHandleOp = new myHandleOperator(_this._viewer, _this);
        _this._myHandleOpHandle = _this._viewer.operatorManager.registerCustomOperator(_this._myHandleOp);
        
        // Register HandleOperator operator
        _this._handleOpOp = new HandleOperatorOperator(_this._viewer, _this._myHandleOp, _this._myHandleOpHandle);
        _this._handleOpOpHandle = _this._viewer.operatorManager.registerCustomOperator(_this._handleOpOp);

        _this._viewer.start();
        
    });
}

animation_creator.prototype.highlightNode = function(nodeId, key_ctrl) {
    var _this = this;
    
    if (_this._isNodesSelection) {
        _this._nodesSelOp.selected(nodeId);
    }
    else if (_this._isNodesHandleSelection) {
        _this._viewer.model.resetModelHighlight();
        _this._handleOpOp.setHandleNodeId(nodeId);
        _this._viewer.model.setNodesHighlighted([nodeId], true);
    } 
    else {
        var mode = Communicator.SelectionMode.Set;
        if (key_ctrl)
            mode = Communicator.SelectionMode.Toggle

        _this._viewer.getSelectionManager().selectNode(nodeId, mode);
    }
};

animation_creator.prototype.resetLineHighlighted = function () {
    var _this = this;
    
    var model = _this._viewer.model;
    
    for (var i = 0; i < _this._lineHighlightedNodes.length; i++) {
        var node = _this._lineHighlightedNodes[i];
        getEdgeCnt(model, node).then(function(obj) {
            for (var j = 0; j < obj.count; j++) {
                model.setNodeLineHighlighted(obj.node, j, false);
            }                
        });
    }
    _this._lineHighlightedNodes.length = 0;
};

animation_creator.prototype.setVector = function(vector) {
    var _this = this;
    
    if (vector != undefined) {
        _this._vector = vector;
        $('input[name=axis]').val(['C']);
    } else {
        $('input[name=axis]').val(['X']);
    }
    
    _this._vectorSelOp.clear();
    $("#targetNodes").focus();
    
    _this.showPreview();
};

animation_creator.prototype.showPreview = function(vector) {
    var _this = this;
    
    var command = $("#btnOK").data("command");
    
    if (_this._previewArrow != undefined) {
        _this._viewer.getMarkupManager().unregisterMarkup(_this._previewArrow);
        _this._previewArrow = undefined;
    }
    
    var nodes = _this._nodesSelOp.getNodes();
    if (nodes.length == 0)
        return;
    
    _this._viewer.model.getNodesBounding(nodes).then(function(box){
        var x = box.min.x + (box.max.x - box.min.x) / 2;
        var y = box.min.y + (box.max.y - box.min.y) / 2;
        var z = box.min.z + (box.max.z - box.min.z) / 2;
        var p1 = new Communicator.Point3(x, y, z);

        var a = $('input[name=axis]:checked').val();
        var axis;
        switch(a) {
            case "X":
                axis = new Communicator.Point3(1, 0, 0);
                break;
            case "Y":
                axis = new Communicator.Point3(0, 1, 0);
                break;
            case "Z":
                axis = new Communicator.Point3(0, 0, 1);
                break;
            case "C":
                axis = _this._vector;
        };

        switch (command) {
            case "translate":
                var distance = $("#distance").val();
                if (isNaN(distance))
                    return;
                distance = Number(distance);

                x += axis.x * distance;
                y += axis.y * distance;
                z += axis.z * distance;
                var p2 = new Communicator.Point3(x, y, z);
                var markupItem = new ArrowMarkup(_this._viewer, new Communicator.Color(255, 0, 0));
                markupItem.setPosiiton(p1, p2);
                _this._previewArrow = _this._viewer.getMarkupManager().registerMarkup(markupItem);
                
                break;
            case "rotate":
                var center = _this._pointSelOp.getPoint();
                if (center != undefined) {
                    x = center.x;
                    y = center.y;
                    z = center.z;
                    p1 = new Communicator.Point3(x, y, z);
                }
                
                var angle = $("#angle").val();
                if (isNaN(angle))
                    return;
                angle = Number(angle);
                
                var d = Communicator.Point3.distance(box.min, box.max) / 2;
                x += axis.x * d;
                y += axis.y * d;
                z += axis.z * d;
                var p2 = new Communicator.Point3(x, y, z);                
                var markupItem = new ArrowMarkup(_this._viewer, new Communicator.Color(255, 0, 0));
                markupItem.setPosiiton(p1, p2);
                _this._previewArrow = _this._viewer.getMarkupManager().registerMarkup(markupItem);
                
                break;
        };
    });    
};

function getEdgeCnt(model, node) {    
    return new Promise(function (resolve, reject) {
        model.getEdgeCount(node).then(function(cnt) {
            var obj = {
                node: node,
                count: cnt
            }
            resolve(obj);
        });
    });
}

function selectTreeViewItem(event, obj) {
    var key_event = event || window.event;
    var key_ctrl = (key_event.ctrlKey);
    var id = obj.id;
    mainViewer.highlightNode(Number(obj.id), key_ctrl);
}

        
