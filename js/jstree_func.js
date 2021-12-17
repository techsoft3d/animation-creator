var JstreeTree = function(model, tree) {
    this._model = model;
    this._tree = tree;
    this._treeData;
    this._count = 0;
}

JstreeTree.prototype = {
    createTreeFromJson: function(data) {
        var _this = this;
        
        _this._treeData = data;
        $(this._tree).jstree({
            'core': {
                'data': _this._treeData,
                'themes': {'variant':'large'},
                "check_callback" : true
            },
            'plugins': ['checkbox'],
            'checkbox': {
                'tie_selection': false
            }
        });
    },
    
    updateTree: function() {
        var _this = this;
        
        $(_this._tree).jstree(true).destroy();
        
        $(this._tree).jstree({
            'core': {
                'data': _this._treeData,
                'themes': {'variant':'large'},
                "check_callback" : true
            },
            'plugins': ['checkbox'],
            'checkbox': {
                'tie_selection': false
            }
        });
    },
    
    createTreeFromCurrentModel: function() {
        var _this = this;
        
        var root = _this._model.getRootNode();
        var data = [];
        _this.createTreeObj(root, data, 0);
        
        $(_this._tree).jstree({
            'core': {
                'data': data,
                // 'themes': {'variant':'large'}
            },
        });   
    },
    
    createTreeObj: function(node, data, level) {
        var _this = this;
        var modelNodeName = _this._model.getNodeName(node);

        if(modelNodeName == undefined) {
            console.log("node:" + node);
            return;
        }

        var children = _this._model.getNodeChildren(node);

        var icon = 'jstree-folder';
        if (!children.length) {
            icon = 'jstree-file';
        }

        var opened = true;
        if (2 < level) {
            opened = false;
        }

        if (modelNodeName != undefined) {
            var obj = {
                id: String(node),
                text: modelNodeName + ' [' + String(node) + ']',
                icon: icon,
                state: {
                    opened: opened,
                },
            };
            data.push(obj);
            this._count++;
        }

        if (!children.length) {
            return;
        }

        var dataObj = data[data.length - 1]['children'] = [];

        for (var i = 0; i < children.length; i++) {
            _this.createTreeObj(children[i], dataObj, level + 1);
        }
    },
    
    destroyTree: function() {
        var _this = this;
        $(_this._tree).jstree(true).destroy();
    },
    
    addTreeNode: function(node, treeId, level) {
        var _this = this;
        
        var modelNodeName = _this._model.getNodeName(node);
        
        if(modelNodeName.indexOf('mesh-instance-') == 0) {
            return;
        }
        
        var children = _this._model.getNodeChildren(node);

        var isOpened = false;
//        if (level <= 1)     //&& children.length == 1)
//            isOpened = true;

        var icon = 'jstree-folder';
        if (children.length == 0)
            icon = 'jstree-file';

        if (modelNodeName != undefined) {
            var obj = {
                id: String(node),
                text: modelNodeName,
                icon: icon,
                state: {
                    opened: isOpened,
                }
            };
            var jstree = $(_this._tree).jstree(true);
            jstree.create_node(treeId, obj);   
        }    

        if (!children.length) {
            return;
        }

//        if (level >= 2) {
//            return;
//        }

        level++;
        for (var i = 0; i < children.length; i++) {
            _this.addTreeNode(children[i], String(node), level);
        }
    }
};

