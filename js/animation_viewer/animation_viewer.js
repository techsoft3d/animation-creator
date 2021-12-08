function my_viewer (language) {
    this._viewer;
    this._language = language;
}

my_viewer.prototype.start = function (viewerMode, modelName, reverseProxy) {
    var _this = this;
    _this._initEvents();
    _this._createViewer(viewerMode, modelName, reverseProxy);
}

my_viewer.prototype._initEvents = function () {
    var _this = this;
    
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
        
        $("#animateBtns").offset({ 
            top: winHeight - 260, 
            left: (winWidth - $("#animateBtns").width()) / 2 
        });

        $('#container').height(winHeight - 180);
        $('#container').width(winWidth);
        $('#animationJson').width(winWidth - 40);
        $('#animationJson').offset({
            top: winHeight - 180
        })
    }
    
    $(".animateBtn").on("click", function() {
        var command = $(this).data("command");
        switch (command) {
            case "rewind":
                _this._animationController.rewind();
                break;
            case "play":
                const objStr = $('#animationJson').val();
                var obj = JSON.parse(objStr);
                
                _this._animationController.playByObj(obj);         
                break;
            case "pause":
                _this._animationController.pause();
                break;
        };
    });
}
    
my_viewer.prototype._createViewer = function (viewerMode, modelName, reverseProxy) {
    var _this = this;
    createViewer(viewerMode, modelName, "container", reverseProxy).then(function (hwv) {
        _this._viewer = hwv;
        
        _this._animationController = new AnimationController(_this._viewer);
        
        _this._viewer.start();
    });
}