var SetResources = function(language) {
    var _this = this;
    this._msgs = [];
    this._types = [];
    this._labels = {};
    
    if (language == "ja") {
        _this._setJa();
    } else {
        _this._msgs.push("Distance/Angle value is not proper. Step: "); // 0
        _this._msgs.push("Start time value is not proper. Step: ");     // 1
        _this._msgs.push("Duration time value is not proper. Step: ");  // 2
        _this._msgs.push("Part(s) is not selected.");                   // 3
        _this._msgs.push("Rotation center is not specified.");          // 4
        _this._msgs.push("Rotation angle value is not proper.");        // 5
        _this._msgs.push(" value is not proper.");                      // 6
        _this._msgs.push("Start value is not proper.");                 // 7
        _this._msgs.push("Duration value is not proper.");              // 8
        _this._msgs.push("Select part(s) on the model.");               // 9
        _this._msgs.push("Specify center on the model.");               // 10
        
        _this._types.push("Camera");
        _this._types.push("Translation");
        _this._types.push("Rotation");
        _this._types.push("Hide");
        _this._types.push("Blink");
        
        _this._labels = {
            rotate:     "Rotate",
            roAxis:     "Rotation axis:",
            roCenter:   "Rotation center:",
            translate:  "Translate",
            dir:        "Direction:",
        }
    }
}

SetResources.prototype = {
    getMsgs: function() {
        var _this = this;
        return _this._msgs;
    },
    
    getTypes: function() {
        var _this = this;
        return _this._types;
    },
    
    getLabels: function() {
        var _this = this;
        return _this._labels;
    },
    
    _setJa: function() {
        var _this = this;
        $('.toolbarBtn[data-command="home"]').attr("title", "ホーム");
        $('.toolbarBtn[data-command="camera"]').attr("title", "カメラ");
        $('.toolbarBtn[data-command="translate"]').attr("title", "移動");
        $('.toolbarBtn[data-command="rotate"]').attr("title", "回転");
        $('.toolbarBtn[data-command="hide"]').attr("title", "非表示");
        $('.toolbarBtn[data-command="blink"]').attr("title", "点滅");
        
        $('.save').attr("title", "保存");
        $('.reorder').attr("title", "並び替え");
        
        $('[data-command="rewind"]').attr("title", "巻き戻し");
        $('[data-command="play"]').attr("title", "再生");
        $('[data-command="pause"]').attr("title", "停止");
        
        $("#lblParts").text("パーツ　：");
        $("#lblCustom").text("カスタム");
        $("#lblDistance").text("移動距離：");
        $("#lblAngle").text("回転角度：");
        $("#lblStart").text("開始時間：");
        $("#lblDuration").text("継続時間：");
        $("#btnCancel").val("キャンセル");
        
        var table = document.getElementById("stepTable");
        var cell;
        cell = table.rows[0].cells[0].innerHTML = "#";
        cell = table.rows[0].cells[1].innerHTML = "削除";
        cell = table.rows[0].cells[2].innerHTML = "タイプ";
        cell = table.rows[0].cells[3].innerHTML = "ノード";
        cell = table.rows[0].cells[4].innerHTML = "方向・軸";
        cell = table.rows[0].cells[5].innerHTML = "中心";
        cell = table.rows[0].cells[6].innerHTML = "距離・角度";
        cell = table.rows[0].cells[7].innerHTML = "開始";
        cell = table.rows[0].cells[8].innerHTML = "時間";
        cell = table.rows[0].cells[9].innerHTML = "タイムライン";
        
        _this._msgs.push("距離・角度の値が不正です。 ステップ: ");
        _this._msgs.push("開始時間の値が不正です。 ステップ: ");
        _this._msgs.push("時間の値が不正です。 ステップ: ");
        _this._msgs.push("パーツが選択されていません。");
        _this._msgs.push("回転中心が指定されていません。");
        _this._msgs.push("回転角度の値が不正です。");
        _this._msgs.push("の値が不正です。");
        _this._msgs.push("開始時間の値が不正です。");
        _this._msgs.push("時間の値が不正です。");
        _this._msgs.push("モデル上でパーツを選択");
        _this._msgs.push("モデル上で中心点を指定");
        
        _this._types.push("カメラ");
        _this._types.push("移動");
        _this._types.push("回転");
        _this._types.push("非表示");
        _this._types.push("点滅");
        
        _this._labels = {
            rotate:     "回転",
            roAxis:     "回転軸　：",
            roCenter:   "回転中心：",
            translate:  "移動",
            dir:        "移動方向：",
        }
    } 
};
