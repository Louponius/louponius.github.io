if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != "undefined" ? args[number] : match;
        });
    };
}
//# sourceMappingURL=string.format.js.map;
 /***************************/ 

(function(){


//
    // Hooks for auto binding the fastbutton events.
    //
    var _onShowCalled = Marionette.View.prototype.onShowCalled;
    var _close  = Marionette.View.prototype.close;

    Marionette.View.prototype.onShowCalled = function () {
        _onShowCalled.call(this);
        var options = Marionette.getOption(this, "fastButtonEvents");
        if(options)  createFastButtonBindings(this, options);
    }

    Marionette.View.prototype.close = function () {
        _close.call(this);
        unbindEvents(this);
    }


	/*
        @description:

        The ItemView have a objectHash named fastButtonEvents.
        - it only supports click events.

	    fastButtonEvents: {
            "click .hello": "onClicked1",
            "click": "onClicked2"
        }
    */
	function createFastButtonBindings(scope, events) {
		var keys    = _.keys(events);
        var values  = _.values(events);
        scope._fastButtons = [];

        for (var i = 0;  i < keys.length; i++) {
        	var value = keys[i];
        	var func  = values[i]

	  		if(hasSelector(value)){
	            var obj = getEventAndSelector(value);
	            var elm = scope.$el.find(obj.selector);

	            if(elm.length && typeof scope[func] == "function") 
                    bindFastEvents(scope, {$el: elm, func: scope[func]});
	            
	        }else {

	            if(typeof scope[func] == "function")
	                bindFastEvents(scope, {$el: scope.$el, func: scope[func]});
	        }
	    }
        
	}

	function hasSelector (value) {
        return new RegExp(/[\.\#]/g).test(value)
    }
    
    function getEventAndSelector (value) {
        var match =  value.match(/(\w+)(?:\s)?([\.\#].*)/);
        return {
            event:      match[1],
            selector:   match[2]
        }
    }
    function bindFastEvents (scope, objHandler) {
        objHandler.$el.each(function(){
            var el = $(this).get(0);
           // var btn = new google.ui.FastButton(el, objHandler.func.bind(scope));
            var btn = new FastButton(el, objHandler.func.bind(scope));
            scope._fastButtons.push(btn);
        })
    }
    function unbindEvents(scope) {
    	if(scope.hasOwnProperty("_fastButtons")){
    		_.each(scope._fastButtons, function(btn){
    			btn.unbind();
    		})
    	}
    }

})();

;
 /***************************/ 

(function(){

	var __marionette_view_delegateEvents 	= Marionette.View.prototype.delegateEvents;
	var __marionette_view_undelegateEvents 	= Marionette.View.prototype.undelegateEvents;

	Marionette.View.prototype.delegateEvents = function (events) {
	    __marionette_view_delegateEvents.call(this, events)
	    Marionette.bindEntityEvents(this, this, Marionette.getOption(this, "itemviewEvents"));
	}
	Marionette.View.prototype.undelegateEvents = function () {
	    __marionette_view_undelegateEvents.call(this);
	    Marionette.unbindEntityEvents(this, this, Marionette.getOption(this, "itemviewEvents"));
	}

})();;
 /***************************/ 
(function(){


    // Adding a beforeStart command, 
    // that will be called before the actual start up of the application.
    // 
    // @example
    // 
    // App.beforeStart.addAction(function(){
    //      // some action
    //      return promise: // @jquery.promise
    // })
    // 
    Marionette.Application.prototype.beforeStart = {

        _actions: [],
        
        // adds a before start action
        // @param fnCallback must return a jquery promise.
        addAction: function (fnCallback) {
            this._actions.push(fnCallback);
        },
        
        execute: function () {
            var arrDeferred = [];
            for(var n in this._actions) {
                arrDeferred.push(this._actions[n]());
            }
            return $.when.apply(null, arrDeferred);
        }
    };


    // Custom
    // When the Application.start gets called we will run
    // any beforeStart and wait for them to finish.
    // before starting up the app.
    Marionette.Application.prototype.start = function (options) {

    	var self = this;

    	console.log("[beforeStart]")

    	// All beforeStart actions have completed.
    	this.beforeStart.execute().done(function(){
    		console.log("[beforeStart:completed]")

    		// Default behavior

            self.triggerMethod("initialize:before", options);
            self._initCallbacks.run(options, self);
            self.triggerMethod("initialize:after", options);
            self.triggerMethod("start", options);

    	})
    }
})();;
 /***************************/ 

var TemplateBootstrapRender = function () {

    this.configurablePaths = [
        "src/js/app/apps/{@path}/templates/{@file}.tpl",    
        "src/js/app/components/{@path}/templates/{@file}.tpl"
    ];
};

_.extend(TemplateBootstrapRender.prototype, {

    replaceString: function (input, template) {
        if(input == "" || typeof input == "function") return "";

        var elements = input.split("/");
        var file = elements.pop();
        var path = elements.join("/");

        if(!this.hasPath(template) || !this.hasFile(template)){
            throw new Error("template is missing path or file fields");
        }

        return template
            .replace(/\{@path\}/, path)
            .replace(/\{@file\}/, file);
    },

    hasPath: function  (path) {
        return /\{@path\}/.test(path)
    },

    hasFile: function (file) {
        return /\{@file\}/.test(file);
    },

    templateExists: function (path) {
        return JST.hasOwnProperty(path);
    },

    render: function (path, data) {
        return JST[path](data);
    },

    createPath: function (template) {
        var that = this;
        var strPath = false;

        _.each(this.configurablePaths, function(path){
            var tempPath = that.replaceString(template, path);
            if(that.templateExists(tempPath)){
                strPath = tempPath;
            }
        })

        return strPath;
    }
});


(function(Backbone){


    var customRender = new TemplateBootstrapRender();
    var _render = Backbone.Marionette.Renderer.render;

    
	Backbone.Marionette.Renderer.render = function (template, data) {
		if(template) {
            var strPathMatch = customRender.createPath(template);

			if(strPathMatch !== false) 
				return customRender.render(strPathMatch, data);
			else 
                return _render.apply(this, arguments);
		}
        return "";
	};
   
}(Backbone));;
 /***************************/ 

(function () {
	Marionette.TemplateHelpers = {};

	Marionette.View.prototype.mixinTemplateHelpers = function(target){
		target = target || {};
	    var templateHelpers = Marionette.getOption(this, "templateHelpers") || {};

	    templateHelpers = _.extend(templateHelpers, Marionette.TemplateHelpers);
	    
	    if (_.isFunction(templateHelpers)){
	      templateHelpers = templateHelpers.call(this);
	    }
	    return _.extend(target, templateHelpers);
	};
}());;
 /***************************/ 
(function (context) {
    var Animations = {};
    function createAnimationObject(direction, value) {
        var animations = {};
        animations[direction] = value;
        return animations;
    }
    Animations.bouncy = function ($el, direction, end, options) {
        var defaults = {
            firstDuration: 260,
            secondDuration: 300,
            thirdDuration: 200,
            delayFirst: 0,
            delaySecond: 0,
            delayThird: 0,
            momentumEnd: 10,
            momentumStart: 7,
        };
        _.extend(defaults, options);
        var start = (direction == "left")
            ? $el.position().left
            : $el.position().top;
        var startPosition = (start > end)
            ? start + defaults.momentumStart
            : start - defaults.momentumStart;
        var endPosition = (start > end)
            ? end - defaults.momentumEnd
            : end + defaults.momentumEnd;
        return $el.delay(defaults.delayFirst).animate(createAnimationObject(direction, startPosition), defaults.firstDuration)
            .delay(defaults.delaySecond).animate(createAnimationObject(direction, endPosition), defaults.secondDuration)
            .delay(defaults.delayThird).animate(createAnimationObject(direction, end), defaults.thirdDuration);
    };
    context.Animations = Animations;
}(window));
//# sourceMappingURL=animations.js.map;
 /***************************/ 
(function () {
    var commands = {
        Command: null,
        ParallelCommand: null,
        SerialCommand: null
    };
    window.commands = commands;
    var uid = 0;
    commands.Command = function (options) {
        options = options || {};
        this.id = options.id || uid++;
        if (_.isFunction(this.initialize)) {
            this.initialize(options);
        }
    };
    commands.Command.extend = Backbone.Model.extend;
    _.extend(commands.Command.prototype, Backbone.Events, {
        initialize: function (options) {
            console.log("command initialized");
        },
        execute: function () {
            this.complete();
        },
        complete: function () {
            this.trigger("command:complete");
        },
        destroy: function () { }
    });
    // execute multible commands in a parallel/side by side fasion.
    commands.ParallelCommand = commands.Command.extend({
        initialize: function () {
            this.commands = [];
            this.numExpected = 0;
            this.numFinished = 0;
            this.numIndex = 0;
        },
        addCommand: function (command) {
            command.once("command:complete", this.onSubCommandComplete, this);
            this.commands.push(command);
        },
        execute: function () {
            this.numExpected = this.commands.length;
            this.numFinished = 0;
            for (var i in this.commands) {
                this.commands[i].execute();
            }
        },
        onSubCommandComplete: function () {
            this.numFinished++;
            if (this.numFinished >= this.numExpected) {
                this.complete();
            }
        },
        destroy: function () {
            var self = this;
            _.each(this.commands, function (obj) {
                obj.off("command:complete");
                obj.destroy();
            });
        }
    });
    // Allows execution of commands one by one.
    commands.SerialCommand = commands.Command.extend({
        initialize: function () {
            this.commands = [];
            this.numExpected = 0;
            this.numFinished = 0;
            this.numIndex = 0;
        },
        addCommand: function (command) {
            var that = this;
            command.once("command:complete", function () {
                that.onSubCommandComplete(command);
            });
            this.commands.push(command);
        },
        execute: function () {
            this.numExpected = this.commands.length;
            this.numFinished = 0;
            this.executeNextCommand();
        },
        executeNextCommand: function () {
            var command = this.commands[this.numIndex++];
            this.trigger("before:execute", command);
            command.execute();
            this.trigger("after:execute", command);
        },
        onSubCommandComplete: function (command) {
            this.numFinished++;
            if (this.numFinished >= this.numExpected) {
                this.complete();
            }
            else {
                this.executeNextCommand();
            }
            this.trigger("subcommand:complete", command);
        },
        destroy: function () {
            var self = this;
            _.each(this.commands, function (obj) {
                obj.off("command:complete");
                obj.destroy();
            });
        },
        skipCurrentCommand: function () {
            this.commands[this.numIndex - 1].trigger("command:complete");
        }
    });
    /* example
    var TC = commands.Command.extend({
        initialize: function (option) {
            this.message = option.message;
        },
        execute: function () {
            console.log(this.message)
            this.complete();
        }
    });

    var pc = new commands.ParallelCommand();
        pc.addCommand(new TC({message:"\tp1"}))
        pc.addCommand(new TC({message:"\tp2"}))
        pc.addCommand(new TC({message:"\tp3"}))
        pc.addCommand(new TC({message:"\tp4"}))
        pc.addCommand(new TC({message:"\tp5"}))
        pc.addCommand(new TC({message:"\tp6"}))

        
    var sc = new commands.SerialCommand();
        sc.addCommand(new TC({message:"s1"}))
        sc.addCommand(new TC({message:"s2"}))
        sc.addCommand(pc)
        sc.addCommand(new TC({message:"s3"}))
        sc.addCommand(new TC({message:"s4"}))
        sc.addCommand(new TC({message:"s5"}))
        sc.execute();
    */
})();
//# sourceMappingURL=commands.js.map;
 /***************************/ 
var EventHub = function () {
    _.extend(this, Backbone.Events);
    this.commands = new Backbone.Wreqr.Commands();
    this.reqres = new Backbone.Wreqr.RequestResponse();
};
_.extend(EventHub.prototype, {
    execute: function () {
        var args = Array.prototype.slice.apply(arguments);
        this.commands.execute.apply(this.commands, args);
    },
    request: function () {
        var args = Array.prototype.slice.apply(arguments);
        return this.reqres.request.apply(this.reqres, args);
    },
    destroy: function () {
        this.stopListening();
        this.commands.removeAllHandlers();
        this.reqres.removeAllHandlers();
    }
});
//# sourceMappingURL=eventhub.js.map;
 /***************************/ 
/*

@example dom

    <div class="feedback overflow-hidden" >
        <div class="response-correct position-absolute top-minus-20"><span class="glyphicon glyphicon-thumbs-up"></span>Rigtigt</div>
        <div class="response-wrong 	position-absolute top-minus-20"><span class="glyphicon glyphicon-thumbs-down wrong"></span>Forkert</div>
    </div>
*/
var FeedbackBox = function () {
    this.show = function (correct, h) {
        $(".feedback").removeClass("display-none");
        /*
                if(h){
                    $(".feedback").css({marginTop: - (h + 10)});
                }
        */
        var height = h || $(".feedback").height();
        var positionRevealed = 0;
        console.log("setting height:", h, height);
        if (correct) {
            TweenMax.fromTo(".feedback .response-correct", 0.5, { opacity: 0, top: positionRevealed }, { opacity: 1, top: 0, ease: Elastic.easeInOut });
            TweenMax.to(".feedback .response-correct", 0.5, { opacity: 0, top: 0, delay: 1, ease: Power4.easeOut, onComplete: function () {
                    $(".feedback").addClass("display-none");
                } });
        }
        else {
            TweenMax.fromTo(".feedback .response-wrong", 0.5, { opacity: 0, top: positionRevealed }, { opacity: 1, top: 0, ease: Elastic.easeInOut });
            TweenMax.to(".feedback .response-wrong", 0.5, { opacity: 0, top: 0, delay: 1, ease: Power4.easeOut, onComplete: function () {
                    $(".feedback").addClass("display-none");
                } });
        }
    };
};
//# sourceMappingURL=feedbackbox.js.map;
 /***************************/ 
// example
// http://jsfiddle.net/M5J8Q/1391/
var FlowController = Marionette.Controller.extend({
    initialize: function (options) {
        this.regions = new RegionManager(options);
    },
    getCurrentView: function () {
        return this.regions.currentRegion.currentView;
    },
    getPrevRegion: function () { },
    show: function (flowPage, flow, onTop) {
        if (flowPage.loginForm) {
            console.log("LoginForm: " + true);
        }
        else {
            console.log("LoginForm: " + false);
        }
        var that = this;
        this.currentRegion = this.regions.currentRegion;
        if (!this.currentRegion.hasOwnProperty("currentView")) {
            // There is no current View shown. 
            console.log("No current View shown");
            flowPage.once("onShowComplete", function () {
                flowPage.once("transitionInComplete", function () { });
                flowPage.transitionIn();
            });
            if (flowPage.loginForm) {
                that.regions.getRegion1().show(flowPage);
            }
            else {
                that.regions.getRegion2().show(flowPage);
            }
            //this.currentRegion.show(flowPage);
        }
        else {
            // There is already a view 
            var currentView = this.getCurrentView();
            switch (flow) {
                case "normal":
                default:
                    currentView.once("transitionOutComplete", function () {
                        flowPage.once("onShowComplete", function () {
                            flowPage.once("transitionInComplete", function () { });
                            flowPage.transitionIn();
                        });
                        that.currentRegion.show(flowPage);
                    });
                    currentView.transitionOut();
                    break;
                case "cross":
                    flowPage.once("onShowComplete", function () {
                        new SerialEventListener([currentView, flowPage], ["transitionOutComplete", "transitionInComplete"]).done(function () {
                            that.regions.getPrevRegion().reset();
                            /*complete*/
                        });
                        currentView.transitionOut();
                        flowPage.transitionIn();
                    });
                    that.regions.getNextRegion().show(flowPage);
                    break;
            }
        }
    }
});
//# sourceMappingURL=flow.controller.js.map;
 /***************************/ 
var FlowPage = Marionette.Layout.extend({
    onShow: function () {
        this.onShowComplete();
    },
    onShowComplete: function () {
        this.trigger("onShowComplete");
    },
    transitionIn: function () {
        this.transitionInComplete();
    },
    transitionInComplete: function () {
        this.trigger("transitionInComplete");
        this.onTransitionInComplete();
    },
    onTransitionInComplete: function () {
    },
    transitionOut: function () {
        this.transitionOutComplete();
    },
    transitionOutComplete: function () {
        this.trigger("transitionOutComplete");
        this.onTransitionOutComplete();
    },
    onTransitionOutComplete: function () {
    }
});
//# sourceMappingURL=flow.page.js.map;
 /***************************/ 
var RegionManager = Marionette.Controller.extend({
    initialize: function (options) {
        this.region1 = options.region1;
        this.region2 = options.region2;
        this.currentRegion = this.region1;
    },
    ///Why are their 2 regions??? reducing to 1
    getNextRegion: function () {
        var nextRegion = !this.region1.hasOwnProperty("currentView")
            ? this.region1
            : this.region2;
        this.currentRegion = this.region1; //nextRegion;
        return nextRegion;
    },
    getPrevRegion: function () {
        return this.currentRegion == this.region2 ? this.region1 : this.region2;
    },
    getRegion1: function () {
        return this.region1;
    },
    getRegion2: function () {
        return this.region2;
    },
});
//# sourceMappingURL=flow.regionmanager.js.map;
 /***************************/ 
function getUrlParams() {
    var url = window.location.href;
    var obj = {};
    if (/\?/g.test(url)) {
        var params = /\?(.*)/g.exec(url)[1].split("&");
        for (var p in params) {
            var match = params[p].match(/(\w+)=(\w+)/);
            obj[match[1]] = match[2];
        }
    }
    return obj;
}
//# sourceMappingURL=geturlparams.js.map;
 /***************************/ 
var JSONLoader = function (filePath) {
    var deferred = $.Deferred();
    $.getJSON(filePath + "?cb=" + (+new Date())).done(function (data) {
        deferred.resolve(data);
    }).fail(function () {
        alert("Failed to load file: " + filePath);
    });
    return deferred;
};
//# sourceMappingURL=loaders.js.map;
 /***************************/ 
/**
 * Custom log.
 * usage:
 * Logger.log( "message" )
 *

(function (context) {
    function Logger () {
        this.elmID = "com-cadpeople-log";
        this.$log = null;
    };

    Logger.prototype.createLog = function () {
        if(this.logExists()) return;

        this.$log = $("<div>").addClass(this.elmID);
        this.$log.css({
            width: 400,
            height: 500,
            background: "#fff",
            opacity: 0.8,
            overflowY: "scroll",
            position: "absolute",
            top: 0,
            left: $(window).width() - 400,
            zIndex: 999999
        })
        
        $("body").append(this.$log)
    }

    Logger.prototype.hide = function () {
        $("." + this.elmID).remove();
    }

    Logger.prototype.logExists = function () {
        return $("." + this.elmID).length > 0
    }

    Logger.prototype.addEntry = function (message) {
        this.$log.append("<div>" + message + "<div>")
    }

    Logger.prototype.log = function (message) {
        this.createLog();
        this.addEntry(message);
        
    }

    context.Logger = new Logger()

}(window));


 */ 
//# sourceMappingURL=logger.js.map;
 /***************************/ 
Marionette.InputText = Marionette.ItemView.extend({
    options: {
        validation: /.*/,
        // numbers /\d/ or text /[a-z]/i or what ever u want.
        maxlength: ""
    },
    events: {
        "keydown input": "validateInput",
        "change input": "onChanged",
        "keyup  input": "onChanged"
    },
    initialize: function (options) {
        if (this.model) {
            this.options = _.extend(this.options, this.model.attributes);
        }
        ;
    },
    onShow: function () {
        this.$el.find("input").attr({
            maxlength: this.model.get("maxlength")
        });
    },
    /* protected */
    // return false if not allowed.
    validateInput: function (e) {
        var input = String.fromCharCode(e.keyCode);
        return this.options.validation.test(input);
    },
    /*internal*/
    onChanged: function (e) {
        this.trigger("change", this.value());
        if (e.keyCode == 13 /*enter*/) {
            this.trigger("submit", this.value());
        }
    },
    /*public */
    value: function (val) {
        if (val !== undefined) {
            this.$el.find("input").val(val);
        }
        else {
            return this.$el.find("input").val();
        }
    }
});
//# sourceMappingURL=marionette.input.text.js.map;
 /***************************/ 
Marionette.MenuModel = Backbone.Model.extend({
    defaults: {
        selected: false,
        enabled: true
    }
});
/**
 * Renderer en gruppe af knapper
 *
 * @event {changed [view]} bliver dispatched når et element blive klicked.
 */
Marionette.MenuView = Marionette.CompositeView.extend({
    // Default: retunerer bare et div, så man ikke behøver give den en template.
    template: function () {
        return "<div></div>";
    },
    initialize: function () {
        this.on("itemview:selected", this.updateSelectedItems, this);
        // Decorate models.
        this.collection.each(function (model) {
            model.attributes.selected = model.attributes.hasOwnProperty("selected") ? model.attributes.selected : false;
            model.attributes.enabled = model.attributes.hasOwnProperty("enabled") ? model.attributes.enabled : true;
        });
    },
    setSelectedState: function (value) {
        this.collection.each(function (model) {
            model.set("selected", value);
        });
    },
    /**
     * When ever a button is selected this will be called, by default it will only allow 1 item to be
     * selected, override if u want more specialized behavior.
     *
     * @method updateSelectedItems
     * @param  {MenuItemView}    view       The View that invoked the event.
     */
    updateSelectedItems: function (view) {
        this.setSelectedState(false);
        view.model.set("selected", true);
        this.trigger("changed", view);
    },
    /**
     * Get the value of the selected items, this will return the models attributes
     * override for more specialized behavior.
     *
     * @method value
     * @return {Array<*>}   array containing all the values.
     */
    value: function () {
        var values = [];
        this.children.each(function (view) {
            if (view.model.get("selected")) {
                values.push(view.model.attributes);
            }
        });
        return values;
    },
    /**
     * get the view with the spesifyed id.
     * @method GetByID
     * @param  {*}    id
     * @return {MenuItemView}
     */
    getByID: function (id) {
        return this.children.find(function (view) {
            return view.model.get("ID") == id;
        });
    },
    /**
     * Enable/Disable all buttons
     * @method enable
     * @param  {Boolean}    value      [description]
     */
    enable: function (value) {
        this.children.each(function (view) {
            view.model.set("enabled", value);
        });
    },
    /**
     * Get the selected items.
     * @method getSelectedItems
     * @return {Array<MenuItemView>}
     */
    getSelectedItems: function () {
        return this.children.filter(function (view) {
            return view.model.get("selected");
        });
    },
    /**
     * Get the number of selected Items
     * @method numSelectedItems
     * @return {int}
     */
    numSelectedItems: function () {
        return this.getSelectedItems().length;
    }
});
//# sourceMappingURL=marionette.menu.js.map;
 /***************************/ 
Marionette.MenuItemView = Marionette.ItemView.extend({
    modelEvents: {
        "change:selected": "onSelectedChanged",
        "change:enabled": "onEnabledStateChange"
    },
    events: {
        "click": "onElementClicked"
    },
    /* @protected */
    onRender: function () {
        this.checkStates();
    },
    /* @protected */
    onShow: function () {
        this.checkStates();
    },
    /* @private */
    checkStates: function () {
        this.onSelectedChanged();
        this.onEnabledStateChange();
    },
    /* @private */
    onElementClicked: function () {
        if (!this.model.get("enabled"))
            return;
        console.log("onElementClicked");
        this.onClicked();
        this.trigger("selected");
        this.trigger("click");
    },
    /* @private */
    onSelectedChanged: function () {
        if (this.model.get("selected")) {
            this.onSelected();
        }
        else {
            this.onDeSelected();
        }
    },
    /* @private */
    onEnabledStateChange: function () {
        if (this.model.get("enabled")) {
            this.onEnabled();
        }
        else {
            this.onDisabled();
        }
    },
    /** Abstract methods - should be overridden in subclases.
    **********************************************************************************/
    onEnabled: function () {
        this.$el.css({ opacity: 1, cursor: "pointer" });
    },
    onDisabled: function () {
        this.$el.css({ opacity: .5, cursor: "default" });
    },
    onSelected: function () {
        // apply selected style
    },
    onDeSelected: function () {
        // remove selected style.
    },
    onClicked: function () {
        // do some action.
    },
    /**
     * Return the value of the element
     * @return {*}
     */
    value: function () {
        return this.model.get("lable");
    }
});
//# sourceMappingURL=marionette.menuitem.js.map;
 /***************************/ 
/**

    @description: Creates a rolling animation for displaying text.
    
    @example:
    
    <div class="messageBox">
        <div class="message02"></div>
        <div class="message01"></div>
    </div>
    
    
    new MessageBox(".messageBox", {speed: 0.5, ease: Power4.easeInOut}).showMessage("hello")
*/
function MessageBox(selector, options) {
    var defaults = {
        speed: 0.4,
        ease: Power4.easeInOut,
        fade: false
    };
    options = _.extend(defaults, options);
    var current, next;
    var $el = $(selector);
    var m01 = $el.find(".message01");
    var m02 = $el.find(".message02");
    function setCurrentNext() {
        if (/\b0px/g.test($(m01).attr("style"))) {
            current = m01;
            next = m02;
        }
        else {
            current = m02;
            next = m01;
        }
    }
    function animate() {
        TweenMax.fromTo(next, options.speed, { top: -20 }, { top: 0, ease: options.ease });
        TweenMax.fromTo(current, options.speed, { top: 0 }, { top: 20, ease: options.ease });
    }
    this.showMessage = function (message) {
        setCurrentNext();
        $(next).text(message);
        animate();
    };
    this.showNextMessage = function () {
        setCurrentNext();
        animate();
    };
}
//# sourceMappingURL=messagebox.js.map;
 /***************************/ 
function prettyObjectPrint(obj) {
    function createWhitespaces(n) {
        var result = ": ";
        for (var i = 0; i < n; i++)
            result += " ";
        return result;
    }
    ;
    var longestEntry = 0;
    for (var i in obj) {
        i.toString().length > longestEntry ? longestEntry = i.toString().length : "";
    }
    ;
    for (var i in obj) {
        var diff_in_length = longestEntry - i.toString().length;
        var name = i.toString() + createWhitespaces(diff_in_length);
        console.log(name, obj[i]);
    }
    ;
}
//# sourceMappingURL=prettyobjectprint.js.map;
 /***************************/ 
/**
 * Hvis man har flerer elementer der skal trigger nogle events og man kun vil have en listener.
 * @param elements  [Backbone.Event(Dispatchers)...]
 * @param events    [eventName1, eventName2...]
 * @returns $.Deferred Object
 * @constructor
 */
function SerialEventListener(elements, events) {
    var deferred = $.Deferred();
    var expextedCalls = elements.length;
    var numCalls = 0;
    var onEvent = function () {
        numCalls++;
        if (numCalls >= expextedCalls) {
            deferred.resolve();
        }
    };
    _.each(elements, function (elm, i) {
        elm.once(events[i], onEvent);
    });
    return deferred;
}
//# sourceMappingURL=serialeventlistener.js.map;
 /***************************/ 
var Storage = function () {
};
_.extend(Storage.prototype, {
    /*
        Saves Objects in an array.
        auto adds a _id to each element.
        @param value {object} Must be object.
    */
    saveItem: function (key, value) {
        var dataSet = this.getItems(key);
        this._addID(dataSet, value);
        this._addDate(value);
        dataSet.push(value);
        localStorage.setItem(key, JSON.stringify(dataSet));
    },
    getItems: function (key) {
        var result = JSON.parse(localStorage.getItem(key));
        return result ? result : [];
    },
    getFirstItem: function (key) {
        return this.getItems(key).shift();
    },
    getLastItem: function (key) {
        return this.getItems(key).pop();
    },
    removeItem: function (key) {
        localStorage.removeItem(key);
    },
    clear: function (areYouSure) {
        if (areYouSure)
            localStorage.clear();
        else
            console.log("Are u really sure u want to compleatly empty the storage");
    },
    _addDate: function (value) {
        value.date = new Date().toString().split(" ").splice(0, 5).join(" ");
    },
    _addID: function (dataSet, value) {
        value._id = dataSet.length;
    },
});
//# sourceMappingURL=storage.js.map;
 /***************************/ 
function timeout(callBack, delay) {
    var timeStart = +new Date();
    var timer = setInterval(function () {
        var elapsedTime = (+new Date() - timeStart);
        if (elapsedTime > delay) {
            callBack(elapsedTime);
            clearInterval(timer);
        }
    }, 0);
}
//# sourceMappingURL=timeout.js.map;
 /***************************/ 
function intInRange(min, max) {
    return parseInt(min + (max - min) * Math.random() + .5, 0);
}
;
var WordCreator = function (useNumbers) {
    if (!useNumbers)
        this.chareters = "abcdefghijklmnopqrstvxyz";
    else
        this.chareters = "0123456789";
};
_.extend(WordCreator.prototype, {
    getChareterAtIndex: function (index) {
        return this.chareters.substr(index, 1);
    },
    getRandomIndexInChareters: function () {
        return intInRange(0, this.chareters.length);
    },
    getSafeLength: function (length) {
        return (length >= this.chareters.length - 1)
            ? this.chareters.length - 1 : length;
    },
    createWord: function (length) {
        var result = "";
        while (result.length < length) {
            result += this.getChareterAtIndex(this.getRandomIndexInChareters());
        }
        return result;
    },
    createWordNotEqualTo: function (word, numChareters) {
        var val = word;
        var maxRuns = 100;
        var run = 0;
        while (val == word && run < maxRuns) {
            val = this.createWord(numChareters);
            run++;
        }
        return val;
    }
});
var DataCreator = function (useNumbers) {
    this.wordCreator = new WordCreator(useNumbers);
};
_.extend(DataCreator.prototype, {
    createRandomStructureOfEqualAndNotEqual: function (numElements, precentageNotEqual) {
        var n = numElements;
        var p = precentageNotEqual;
        var numWrongItems = parseInt(n / 100 * p);
        var wrongItensInArray = 0;
        var arrWrongItems = [];
        for (var i = 0; i < n; i++) {
            var value = wrongItensInArray++ < numWrongItems ? false : true;
            arrWrongItems.push(value);
        }
        return _.shuffle(arrWrongItems);
    },
    generateData: function (numElements, numChareters, precentageWrong) {
        var arrShouldThisBeEqual = this.createRandomStructureOfEqualAndNotEqual(numElements, precentageWrong || 0);
        var data = [];
        for (var i = 0; i < numElements; i++)
            data.push(this.createSingleEntry(numChareters, arrShouldThisBeEqual[i]));
        return data;
    },
    createSingleEntry: function (numChareters, isEqual) {
        var stub = { lable: "", value: "" };
        var word = this.wordCreator.createWord(numChareters);
        if (isEqual) {
            stub.lable = word;
            stub.value = word;
        }
        if (!isEqual) {
            stub.lable = word;
            stub.value = this.wordCreator.createWordNotEqualTo(word, numChareters);
        }
        return stub;
    }
});
//# sourceMappingURL=wordcreator.js.map;
 /***************************/ 
var zoo = {
    random: {
        intInRange: function (min, max) {
            return parseInt(min + (max - min) * Math.random() + .5, 0);
        }
    },
    strings: {
        toObject: function (input, format) {
            if (!_.isString(input)) {
                throw new Error("input must be a string");
            }
            var obj = {};
            //var value = input;
            var _format = (format && format !== "") ? format : "key:value,";
            var asignerAndDelimiter = _format.replace(/[\w\d]+/g, "");
            var asigner = asignerAndDelimiter[0];
            var delimiter = asignerAndDelimiter[1];
            var value = input.toLowerCase().replace(/\s/g, "").split(delimiter);
            for (var n in value) {
                var match = value[n].match(new RegExp("([^" + asigner + "]+?)" + asigner + "([\\w\\W]+)"));
                if (match) {
                    var key = match[1];
                    var prob = match[2];
                    if (!prob.match(/[^\d-]+/))
                        prob = parseInt(prob);
                    obj[key] = prob;
                }
            }
            return obj;
        },
    },
    validation: {
        isEmail: function (value) {
            return /[^\@]+@\w+\.\w{2,3}(?:.\w{2,3})?/.test(value);
        }
    }
};
//# sourceMappingURL=zoo.js.map;
 /***************************/ 
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Application = Marionette.Application;
//comment
var FrontReadApp = /** @class */ (function (_super) {
    __extends(FrontReadApp, _super);
    function FrontReadApp() {
        var _this = _super.call(this) || this;
        _this.version = "3.1.5";
        _this.userdata = null;
        _this.currentModule = "0";
        _this.currentLevel = 0;
        _this.currentExercise = "";
        _this.currentAttempt = 0;
        _this.userDefinedExerciseSetting = 0;
        _this.iFrameApiLoaded = false;
        _this.isOnline = true;
        _this.displayGroupChooser = true;
        _this.askForGroupId = false;
        _this.roadmap = [
            "t1",
            "m1-1",
            "m1-2",
            "m1-3",
            "t2",
            "m2-4",
            "m2-5",
            "m2-6",
            "t3",
            "m3-7",
            "m3-8",
            "m3-9",
            "t4",
            "diplom"
        ];
        _this.UserProfile = {
            username: "",
            password: "",
            id: "",
            frontreadtoken: "",
            savedataID: "",
            dataset: "",
            name: "",
            userType: "",
            getFileName: function () {
                return this.id + "userdata";
            }
        };
        _this.LogEvent = function (logMessage, logObject) {
            if (logObject) {
                console.log("logMessage: " + logMessage + " " + JSON.stringify(logObject));
            }
            else {
                console.log("logMessage: " + logMessage);
            }
            // TODO: Send log event to some log server
        };
        // Function to pass page views to Google Analytics
        _this.ga = function (page) {
            gtag('config', window.GA_TRACKING_ID, {
                page_path: page,
                app_name: 'FrontRead',
                send_page_view: true
            });
        };
        //Function to pass events to Google Analytics
        _this.gaEvent = function (action, alwaysExecute) {
            if (!config.can_change_dataset || !!alwaysExecute) {
                gtag('event', action);
            }
        };
        //Sending info to google analytics
        _this.getGaPath = function () {
            if (window.location.href.includes("#") && window.location.href.includes("frontread")) {
                var path = window.location.href.split('#')[1].split("/").join("-");
                console.log("google analytics send:", path);
                if (path == "") {
                    return "map";
                }
                else {
                    return path;
                }
            }
        };
        _this.showPwaInstallBtn = function () {
            if (window.pwaPrompt == null) {
                return false;
            }
            if (window.matchMedia('(display-mode: standalone)').matches) {
                return false;
            }
            else {
                return true;
            }
        };
        _this.ExtractIso = function () {
            var locationHref = window.location.href;
            var languageKey = "iso_639-3:";
            var isoIndex = locationHref.indexOf(languageKey);
            var returnElement = {
                iso_639_3: "",
                found: false,
            };
            if (isoIndex > -1) {
                var iso_639_3 = locationHref.substring(isoIndex + languageKey.length, isoIndex + languageKey.length + 3);
                console.log("iso_639-3: " + iso_639_3);
                if (_.contains(config.languages, iso_639_3)) {
                    console.log("does contain: " + iso_639_3);
                    returnElement.iso_639_3 = iso_639_3;
                    returnElement.found = true;
                }
            }
            return returnElement;
        };
        _this.ServerUrl = function () {
            if (!App.serverUrl) {
                var locationHref = window.location.href;
                var languageKey = "iso_639-3:";
                var isoIndex = locationHref.indexOf(languageKey);
                if (!config.language) {
                    var isoElement = App.ExtractIso();
                    if (isoElement.found) {
                        config.language = isoElement.iso_639_3;
                        console.log("config.language found to be: " + config.language);
                    }
                    else {
                        App.Guess();
                        console.log("Language guessed as: " + config.language);
                    }
                }
                if (config.forceDevServer) {
                    console.log("Using PartnerDev");
                    App.serverUrl = "http://partnerdev.frontread.dk";
                }
                else if (config.forceLocalhost) {
                    App.serverUrl = "http://localhost:5000";
                }
                else {
                    switch (config.language) {
                        case "dan":
                            App.serverUrl = "https://partner.frontread.dk";
                            break;
                        case "deu":
                            App.serverUrl = "https://partner.frontread.dk";
                            break;
                        case "eng":
                            App.serverUrl = "https://partner.frontread.dk";
                            break;
                        default:
                            App.serverUrl = "https://partner.frontread.dk";
                            break;
                    }
                }
            }
            return App.serverUrl;
        };
        _this.Guess = function () {
            var locationHref = window.location.href;
            for (var i = 0; i < config.languages.length; i++) {
                if (locationHref.indexOf(config.topDomain[config.languages[i]]) > -1) {
                    config.language = config.languages[i];
                    console.log("Domain: " + localhostDomain);
                    return;
                }
            }
            config.language = english;
            console.log("Domain Default");
        };
        _this.translate = function (id) {
            return Assets.getAsset("strings", id, App.Language());
        };
        _this.Language = function () {
            if (!App.serverUrl) {
                return config.language;
            }
            else {
                App.ServerUrl();
                return config.language;
            }
        };
        _this.SendLogToServer = function (logtype, message) {
            ///NO CONSOLE LOGS INHERE - they will ddos attack us-self
            if (!App.userdata) {
                App.userdata = {};
            }
            $.ajax({
                type: 'POST',
                url: App.ServerUrl() + "/log",
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                },
                data: {
                    logtype: logtype,
                    message: message,
                    id: App.userdata._id
                }
            }).done(function (data) {
            }).fail(function (data) {
            });
        };
        _this.getQuerryString = function () {
            var a = [App.currentModule, App.currentLevel, App.currentExercise, App.currentAttempt];
            var result = [];
            for (var i in a) {
                if (a[i] == "" || a[i] == undefined || a[i] == "undefined")
                    break;
                result.push(a[i]);
            }
            var resultStr = result.join("/").replace(/\/{2,}/, "").replace(/^\d/, "");
            return resultStr;
        };
        _this.setQueryFromFragment = function () {
            var fragment = Backbone.history.getFragment().split("/").slice(1);
            App.currentModule = fragment[0];
            App.currentLevel = parseInt(fragment[1]);
            App.currentExercise = fragment[2];
            App.currentAttempt = parseInt(fragment[3]);
        };
        _this.getCurrentExerciseData = function () {
            var dataQuery = "module:{0}, level:{1}, exercise: {2}, attempt: {3}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise, App.currentAttempt.toString());
            var appData = App.request("entities:data:query", dataQuery);
            return appData;
        };
        _this.getCreateConfigurationPageQuery = function () {
            return "#configuration/{0}/{1}/{2}/{3}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise, App.currentAttempt.toString());
        };
        _this.on("before:start", function () {
            // TODO: Use this event in Marionette 2+
        });
        _this.addRegions({ navbarRegion: "#navbarRegion" });
        return _this;
    }
    return FrontReadApp;
}(Marionette.Application));
function createBasicAuthenticationHeader(username, password) {
    return "Basic " + btoa(unescape(encodeURIComponent(username + ":" + password)));
}
var App = new FrontReadApp();
var localhostDomain = "file:///";
window.App = App;
App.reqres.setHandler("language", function () {
    return App.Language();
});
Marionette.TemplateHelpers = {
    translate: function (id) {
        return Assets.getAsset("strings", id, App.Language());
    }
};
// ------------------------------------------------------------
// REGIONS
// ------------------------------------------------------------
App.addRegions({
    menuRegion: "#menuRegion",
    popupRegion: "#popupRegion",
    contentRegion: "#contentRegion",
    profileMenuRegion: "#profileMenuRegion",
    videoPopupRegion: "#videoPopupRegion",
    utilPopupRegion: "#utilPopupRegion",
    dialogRegion: "#dialogRegion"
});
// ------------------------------------------------------------
// BEFORE START
// ------------------------------------------------------------
/**
 * This function relies on a customization of Marionette 1.4.1, which adds Application.beforeStart.
 * Marionette 2 has a similar application event called onBeforeStart.
 * FIXME: Refactor and use the "before:start" event when upgrading to Marionette 2+
 */
App.beforeStart.addAction(function () {
    function takeOverConsole() {
        var console = window.console;
        if (!console)
            return;
        function intercept(method) {
            var original = console[method];
            console[method] = function () {
                var message = Array.prototype.slice.apply(arguments).join(' ');
                App.SendLogToServer(method, message);
                // do sneaky stuff
                if (original.call) {
                    // Do this for normal browsers
                    original.call(console, method + ": " + message);
                }
                else {
                    // Do this for IE
                    original(method + ": " + message);
                }
            };
        }
        var methods = ['warn', 'error'];
        for (var i = 0; i < methods.length; i++)
            intercept(methods[i]);
    }
    takeOverConsole();
    return Server.initialize();
});
/**
 * This function relies on a customization of Marionette 1.4.1, which adds Application.beforeStart.
 * Marionette 2 has a similar application event called onBeforeStart.
 * FIXME: Refactor and use the "before:start" event when upgrading to Marionette 2+
 */
App.beforeStart.addAction(function () { return Assets.initialize(); });
// ------------------------------------------------------------
// For PWA reasons
window.addEventListener('offline', function (e) {
    if (window.matchMedia('(display-mode: standalone)').matches || window.pwa_installed) {
        window.location.replace('offline.html');
    }
});
// To check for PWA install on chrome
window.pwaPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); // to prevent early versions of chrome to prompt for installation
    window.pwaPrompt = e; // variable to be used to trigger install.
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        console.log("showing install btn");
        $(".installPWAbtn").removeClass("display-none");
    }
});
App.showInstallBtnOnIos = function () {
    var standalone;
    if (typeof navigator.standalone != "undefined") {
        standalone = navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    }
    else {
        standalone = window.matchMedia('(display-mode: standalone)').matches;
    }
    var isApple = /apple/.test(navigator.vendor.toLowerCase());
    //detect if isSafari
    var ua = window.navigator.userAgent;
    var iOS = !!ua.match(/iP(ad|od|hone)/i);
    var hasSafariInUa = !!ua.match(/Safari/i);
    var noOtherBrowsersInUa = !ua.match(/Chrome|CriOS|OPiOS|mercury|FxiOS|Firefox/i);
    var isSafari = false;
    if (iOS) { //detecting Safari in IOS mobile browsers
        var webkit = !!ua.match(/WebKit/i);
        isSafari = webkit && hasSafariInUa && noOtherBrowsersInUa;
    }
    else if (window.safari !== undefined) { //detecting Safari in Desktop Browsers
        isSafari = true;
    }
    else { // detecting Safari in other platforms
        isSafari = hasSafariInUa && noOtherBrowsersInUa;
    }
    return isApple && navigator.maxTouchPoints > 1 && !standalone && isSafari;
};
window.addEventListener('appinstalled', function (evt) {
    App.gaEvent("INSTALLED_ON_CHROME", true);
    $(".installPWAbtn").addClass("display-none"); //removes install btn from the newly installation, because the browser does not reload after installation
    console.log("installed");
});
$(function () {
    setTimeout(function () {
        /* to allow the script injector to finish*/
        console.log("delayed start to allow for the script injector to finish");
        App.start();
        if ('serviceWorker' in navigator) {
            try {
                navigator.serviceWorker.register('serviceworker.js');
                console.log("serviceworker is registred");
            }
            catch (e) {
                console.log('ServiceWorker registration failed. Sorry about that.');
            }
        }
        console.log("showPwaInstallBtn: ", App.showPwaInstallBtn());
    }, 1000);
});
// ------------------------------------------------------------
// On the configuration pages the user have the choice
// to override the level defined settings.
// if (config.mobile_app) {
//     document.addEventListener("online", function () {
//         App.isOnline = true;
//         App.vent.trigger("device-network-status-changed");
//     });
//     document.addEventListener("offline", function () {
//         App.isOnline = false;
//         App.vent.trigger("device-network-status-changed");
//     });
//     document.addEventListener("deviceready", function () {
//         App.start();
//     });
//     $(function () {
//         setTimeout(function () {
//             /// fallback start the app
//             console.log("fallback start the app");
//             App.start();
//         }, 10000);
//     });
// } else {
// }
//# sourceMappingURL=app.js.map;
 /***************************/ 
App.module("base", function (base, App, _Backbone, Marionette, $, _) {
    var BasePage = FlowPage.extend({
        template: "pages/home/home.exercise.test.page",
        regions: {
            "contentRegion": ".myTestContainer",
        },
        createNestedPage: function (type) {
            switch (App.currentExercise) {
                case "f1":
                    App.Pages.F1.Controller.createExerscisePage(this.contentRegion);
                    break;
                case "f2":
                    App.Pages.F2.Controller.createExerscisePage(this.contentRegion);
                    break;
                case "f3":
                    App.Pages.F3.Controller.createExerscisePage(this.contentRegion);
                    break;
                case "f4":
                    $("#popupRegion .content").css({ background: "#302927" });
                    App.Pages.F4.Controller.createExerscisePage(this.contentRegion);
                    break;
            }
        },
        initialize: function () {
            this.listenTo(App.vent, "changeInUserData", this.onShow, this);
        },
        onShow: function () {
            App.setQueryFromFragment();
            this.createNestedPage();
            this.onShowComplete();
        },
        transitionIn: function () {
            var $el = $("#popupRegion .content");
            $("#popupRegion").removeClass("visibility-hidden");
            var from = { force3D: true, scale: 0.7 };
            var to = { force3D: true, scale: 1, ease: Power3.easeOut };
            TweenMax.fromTo($el, 0.6, from, to);
            TweenMax.fromTo($("#popupRegion"), 0.6, { autoAlpha: 0, display: "block" }, { autoAlpha: 1 });
            this.transitionInComplete();
        },
        transitionOut: function () {
            TweenMax.to($("#popupRegion"), 0.5, {
                force3D: true,
                scale: 0.7,
                autoAlpha: 0,
                onComplete: this.transitionOutComplete.bind(this)
            });
        }
    });
    base.ExercisePage = BasePage.extend({
        createNestedPage: function () {
            console.log("Current exercise: " + App.currentExercise);
            switch (App.currentExercise) {
                case "f1":
                    App.Pages.F1.Controller.createExerscisePage(this.contentRegion);
                    break;
                case "f2":
                    App.Pages.F2.Controller.createExerscisePage(this.contentRegion);
                    break;
                case "f3":
                    App.Pages.F3.Controller.createExerscisePage(this.contentRegion);
                    break;
                case "f4":
                    $("#popupRegion .content").css({ background: "#302927" });
                    App.Pages.F4.Controller.createExerscisePage(this.contentRegion);
                    break;
            }
        }
    });
    base.TestPage = BasePage.extend({
        createNestedPage: function () {
            var view = new App.Pages.Tests.Intro.View();
            this.contentRegion.show(view);
            this.listenTo(view, "createExerciseView", this.createExerciseView, this);
        },
        createExerciseView: function () {
            App.Pages.Tests.ReadSpeed.Controller.createExerscisePage(this.contentRegion);
        }
    });
});
//# sourceMappingURL=exercise.base.page.js.map;
 /***************************/ 
var loadedAssets;
var Assets = {
    NO_PARAMS: "assets error: malformed querry - missing type or id",
    NO_SUCH_ASSET_TYPE: "assets error: no such asset type '{0}'",
    NO_ASSET_ASSET_ENTRY: "[{0}]".toUpperCase(),
    NO_LANGUAGE_DEFINED: "asset error: no language defined for id '{0}'",
    initialize: function () {
        var $deferred = $.Deferred();
        $.getJSON("assets/json/assets.json" + "?cb=" + (+new Date())).done(function (data) {
            loadedAssets = data;
            $deferred.resolve();
        }).fail(function () {
            alert("assets.json Load Fail; missing or incorrect format");
            $deferred.resolve();
        });
        return $deferred;
    },
    getAsset: function (type, id, iso_639_3) {
        if (iso_639_3 == null) {
            iso_639_3 = 'eng';
        }
        if (!type || !id)
            return this.NO_PARAMS;
        if (!loadedAssets.hasOwnProperty(type))
            return this.NO_SUCH_ASSET_TYPE.format(type);
        var result = _.find(loadedAssets[type], function (entry) {
            return entry.id == id;
        });
        if (!result)
            return this.NO_ASSET_ASSET_ENTRY.format(id);
        if (!result.hasOwnProperty("languages"))
            return this.NO_LANGUAGE_DEFINED.format(id);
        if (result.languages.length == 0)
            return this.NO_LANGUAGE_DEFINED.format(id);
        var entities = _.find(result.languages, function (obj) {
            return obj.language == iso_639_3;
        });
        if (!entities) {
            entities = _.find(result.languages, function (obj) {
                return obj.language == "*";
            });
        }
        if (!entities) {
            console.error("assets.json did not contain key: " + id + " , and language " + iso_639_3);
            return "id error:" + id + ", language:" + iso_639_3;
        }
        return entities.value;
    }
};
//# sourceMappingURL=assets.js.map;
 /***************************/ 
(function (context) {
    function DataManager() {
    }
    context.DataManager = new DataManager();
    /**
     * Get the correct video based on videoID dataset and language
     * @param videoID int
     * @data Object { videos, folders, dataset, language}
     * @return Object {id, src, poster}
     */
    DataManager.prototype.getVideoByID = function (videoID, data) {
        var videoObj = _.where(data.videos, { id: videoID })[0];
        var videoPath = function () {
            return App.Language();
        };
        var baseUrl = config.mobile_app ? "https://app.frontread.com/" : "/";
        return {
            id: videoObj.id,
            src: baseUrl + videoObj.src.format(videoPath()),
            poster: baseUrl + videoObj.poster.format(App.Language()),
            youtubeId: videoObj.youtubeId,
        };
    };
}(window));
//# sourceMappingURL=datamanager.js.map;
 /***************************/ 
(function () {
    // utils ---------------------------------------------------------------------
    function createBasicAuthenticationHeader(username, password) {
        return "Basic " + btoa(unescape(encodeURIComponent(username + ":" + password)));
    }
    // INFO  ------------------------------------------------------------------------
    var Info = {
        isOnline: function () {
            var status = true;
            /*
             if(navigator.hasOwnProperty("connection") && window.hasOwnProperty("Connection")){
             var networkState = navigator.connection.type;
             status = networkState == Connection.NONE ? false : true;
             }
             */
            if (navigator.hasOwnProperty("onLine"))
                status = navigator.onLine;
            return status;
        },
    };
    // FILE SYSTEM  ------------------------------------------------------------------------
    var CordovaFileSystem = {
        _getFileStore: function (callback) {
            var self = this;
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                myFileSystem = fileSystem;
                callback(null, myFileSystem);
            }, function (err) {
                self.filesystemErrorHandler(err, callback);
            });
        },
        _getFile: function (filename, callback) {
            var self = this;
            this._getFileStore(function (err, fileSystem) {
                if (err) {
                    callback(err);
                }
                else {
                    fileSystem.root.getFile(filename, { create: true }, function (fileEntry) {
                        callback(null, fileEntry);
                    }, function (err) {
                        self.filesystemErrorHandler(err, callback);
                    });
                }
            });
        },
        _readFile: function (filename, callback) {
            this._getFile(filename, function (err, fileEntry) {
                if (err)
                    callback(err);
                else {
                    fileEntry.file(function (file) {
                        var reader = new FileReader();
                        reader.onloadend = function (e) {
                            var result = (typeof this.result == "string" &&
                                this.result !== "" &&
                                this.result !== "undefined" &&
                                this.result !== undefined &&
                                this.result !== null)
                                ? JSON.parse(this.result)
                                : "";
                            callback(null, result);
                        };
                        reader.readAsText(file);
                    }, function (err) {
                        callback(err);
                    });
                }
            });
        },
        _writeFile: function (filename, data, callback) {
            console.log("CordovaFileSystem.writeFile: " + filename);
            var self = this;
            this._getFile(filename, function (err, fileEntry) {
                if (err) {
                    callback(err);
                }
                else {
                    fileEntry.createWriter(function (fileWriter) {
                        fileWriter.onwriteend = function (e) {
                            callback(null, { msg: 'file saved successfully' });
                        };
                        fileWriter.onerrr = function (e) {
                            callback(e.toString());
                        };
                        var blob = new Blob([JSON.stringify(data)], { type: 'text/plain' });
                        fileWriter.write(blob);
                    }, function (err) {
                        self.filesystemErrorHandler(err, callback);
                    });
                }
            });
        },
        filesystemErrorHandler: function (e, callback) {
            var msg = '';
            switch (e.code) {
                case FileError.QUOTA_EXCEEDED_ERR:
                    msg = 'QUOTA_EXCEEDED_ERR';
                    break;
                case FileError.NOT_FOUND_ERR:
                    msg = 'NOT_FOUND_ERR';
                    break;
                case FileError.SECURITY_ERR:
                    msg = 'SECURITY_ERR';
                    break;
                case FileError.INVALID_MODIFICATION_ERR:
                    msg = 'INVALID_MODIFICATION_ERR';
                    break;
                case FileError.INVALID_STATE_ERR:
                    msg = 'INVALID_STATE_ERR';
                    break;
                default:
                    msg = 'Unknown Error';
                    break;
            }
            callback(msg);
        }
    };
    // Authenticator ------------------------------------------------------------------------
    function SetLocalStorage(data) {
        if (data) {
            console.log("SetLocalStorage");
            if ((data._partnersAdm && data._partnersAdm.length > 0) ||
                (data._institutionsAdm && data._institutionsAdm.length > 0) ||
                (data._groupsAdm && data._groupsAdm.length > 0) ||
                (data._studentsAdm && data._studentsAdm.length > 0)) {
                localStorage.setItem("rights", "admin");
            }
            else if (data.username == App.translate('demoapp')) {
                localStorage.setItem("rights", "admin");
            }
            else {
                localStorage.setItem("rights", "student");
            }
            localStorage.setItem("username", data.username);
            localStorage.setItem("userid", data._id);
            localStorage.setItem("frontreadtoken", data.auth);
            localStorage.setItem("groupCode", data._group.groupCode);
            if (data._saveData) {
                localStorage.setItem("savedataID", data._saveData);
            }
        }
        else {
            localStorage.setItem("username", "");
            localStorage.setItem("frontreadtoken", "");
            localStorage.setItem("password", "");
            localStorage.setItem("userid", "");
            localStorage.setItem("groupCode", "");
            localStorage.setItem("rights", "");
        }
    }
    var Authenticator = {
        retryCount: 10,
        maxRetrys: 10,
        //contacting frontread server (auth + userprogress)
        autenticate_frontread: function (username, password, callback) {
            console.log("Lang: " + config.language);
            var self = this;
            if (Info.isOnline()) {
                $.ajax({
                    url: App.ServerUrl() + "/auth",
                    type: 'POST',
                    data: { username: username, password: password },
                    cache: false,
                    headers: {
                        Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                    },
                    dataType: 'json'
                }).done(function (data) {
                    console.log("auth-p");
                    localStorage.setItem("password", password);
                    SetLocalStorage(data);
                    App.LogEvent("Logged in");
                    App.UserProfile.username = username;
                    App.UserProfile.password = password;
                    App.UserProfile.frontreadtoken = data.frontreadtoken;
                    App.UserProfile.userType = "FR";
                    App.UserProfile.savedataID = data._saveData;
                    App.UserProfile.name = data.name;
                    App.UserProfile.id = data._id;
                    config.ProcessDescription(data);
                    DataStore.API().authenticated = true;
                    callback(null, data);
                }).fail(function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log("error-auth-p-j " + JSON.stringify(XMLHttpRequest));
                    console.log("error-auth-p-t " + textStatus);
                    console.log("error-auth-p-e " + errorThrown);
                    if (XMLHttpRequest.status == 0) {
                        if (self.retryCount > 0) {
                            console.log("no connection to the server, lets try that again (" + (self.retryCount--) + ") more times: " + XMLHttpRequest.status);
                            setTimeout(function () {
                                self.autenticate_frontread(username, password, callback);
                            }, 1000);
                        }
                        else {
                            console.log("could not connect to the server...: " + XMLHttpRequest.status);
                            callback(true, { status: XMLHttpRequest.status, message: errorThrown });
                        }
                    }
                    else {
                        callback(true, { status: XMLHttpRequest.status, message: errorThrown });
                    }
                });
            }
            else {
                self.retryCount = self.maxRetrys;
                var username_1 = localStorage.getItem("username");
                var password_1 = localStorage.getItem("password");
                var userid = localStorage.getItem("userid");
                var frontreadtoken = localStorage.getItem("frontreadtoken");
                console.log("DataStore.Authenticate.Offline");
                if (username_1 !== "" && password_1 !== "" && userid !== "") {
                    console.log("Authentication Success");
                    App.UserProfile.username = username_1;
                    App.UserProfile.password = password_1;
                    App.UserProfile.id = userid;
                    App.UserProfile.frontreadtoken = frontreadtoken;
                    DataStore.API().authenticated = true;
                    callback(null, userid);
                }
                else {
                    console.log("Authentication Failed: datastore");
                    callback(null, { status: 500 });
                }
            }
        },
        //contacting unic with uni username and password
        authenticate_UNI_mobile: function (username, password, callback) {
            console.log("Authenticate uni mobile");
            var wsBrugerid = "wscadppl";
            var UTCtime = new Date().getTime() / 1000;
            var kontekst = "A03790";
            var projekt = "frontread";
            var BrugerId = username;
            var wsPassword = "kiLPqsQnUn3bbEY";
            var brugerpassword = password;
            var k0_1 = CryptoJS.SHA1(wsPassword);
            k0_1 = k0_1.toString(CryptoJS.enc.Base64);
            var k0_2 = CryptoJS.SHA1(brugerpassword);
            k0_2 = k0_2.toString(CryptoJS.enc.Base64);
            var k0 = k0_1 + k0_2;
            var M0 = UTCtime + kontekst + projekt + BrugerId;
            var hmachash = CryptoJS.HmacSHA1(M0, k0);
            var Auth = hmachash.toString();
            var url = "https://auth.emu.dk/mauth/?";
            var data = "wsBrugerid=" + wsBrugerid + "&wsPassword=" + wsPassword + "&UTCtime=" + UTCtime + "&kontekst=" + kontekst + "&projekt=" + projekt + "&BrugerId=" + BrugerId + "&Auth=" + Auth + "&callback=?";
            var request = new XMLHttpRequest();
            request.open("GET", url + data, true);
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status == 200 || request.status == 0) {
                        var res = request.responseText == "" ? { VALID: 0 } : JSON.parse(request.responseText);
                        //From Uni-logins documentation on request.responseText.VALID:
                        ///Et tal repræsenteret som tegnstreng, og en af:
                        ///"-3": Systemfejl, rapporter venligst til UNI•C, unilogin-appl@uni-c.dk sammen med tidspunkt og detaljer i kald.
                        ///"-2": Timestamp fejl - dvs. Auth er forældet.
                        ///"-1": Brugerid er ikke tilmeldt app - dvs. har ikke licens til projektet.
                        ///"0": Brugerid/Password er forkert.
                        ///"1": Brugerid/Password er korrekt, og bruger har licens til projektet.
                        ///We choose to sort on the server if they are valid users to in have to option on the server to
                        ///circumvent the uni-login "unlicensed users" error. Currently holstebro vuc does this
                        if (res.VALID == 1 || res.VALID == -1) {
                            console.log("unic mobile authentication success");
                            //self.autenticate_frontread(username, config.common_unic_user_password, callback);
                            App.askForGroupId = true;
                            App.UserProfile.userType = "UNI";
                            callback(null, { status: request.status });
                        }
                        else if (res.VALID == 0) {
                            console.error("VALID == 0 data: " + data);
                            console.error("VALID == 0 uni mobile login failed " + username + ", res " + JSON.stringify(res));
                            console.error("VALID == 0 request " + JSON.stringify(request));
                            callback(true, { status: 403 }); // unic- login fail special error status code.
                        }
                        else {
                            //callback('error: login faled')
                            console.error("data: " + data);
                            console.error("uni mobile login failed " + username + ", res " + JSON.stringify(res));
                            console.error("request " + JSON.stringify(request));
                            callback(true, { status: 522 }); // unic- login fail special error status code.
                        }
                    }
                }
            };
            request.send();
        },
        //contacting unic to get token
        authenticate_UNI_web: function () {
            console.log("Lang UNI Web: " + config.language);
            var id = config.uniID;
            var secret = config.uniSecret;
            var returnURL = config.uniWebReturnUrl();
            var path = this.URI_ESCAPE(this.BASE64(returnURL));
            var auth = this.MD5(returnURL + secret);
            window.location.href = "https://sli.emu.dk/unilogin/login.cgi?id={0}&path={1}&auth={2}".format(id, path, auth);
        },
        // check unic token and if group is still stored and its not a refresh
        isAuthenticatedBy_UNI_web: function () {
            var secret = config.uniSecret;
            var params = getUrlParams();
            App.askForGroupId = true;
            App.UserProfile.userType = "UNI";
            return params.auth == this.MD5(params.timestamp + secret + params.user);
        },
        //contacting frontread (userprogress)
        authenticateUni: function (params, callback) {
            //clearing group to void refreshing add ending up directly in an exercise without proper initilization
            UserData.clearGroup();
            $.ajax({
                url: App.ServerUrl() + "/auth",
                type: 'POST',
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                },
                data: {
                    uniID: params.unicID
                }
            }).done(function (data) {
                SetLocalStorage(data);
                App.LogEvent("Logged in");
                App.UserProfile.savedataID = data._saveData;
                App.UserProfile.name = data.name;
                App.UserProfile.id = data._id;
                App.UserProfile.frontreadtoken = data.frontreadtoken;
                App.UserProfile.userType = "UNI";
                config.ProcessDescription(data);
                callback(null, data);
            }).fail(function (data) {
                UserData.setUnicWebAuthentication(data);
                callback(true, data);
            });
        },
        logout: function () {
            SetLocalStorage(null);
        },
        URI_ESCAPE: function (input) {
            return escape(input);
        },
        BASE64: function (input) {
            return window.btoa(input);
        },
        MD5: function (input) {
            return CryptoJS.MD5(input).toString();
        }
    };
    // NEW STORAGE
    var ServerFunctions = {
        loadUserData: function (params, callback) {
            $.ajax({
                type: 'GET',
                url: App.ServerUrl() + "/savedata/" + App.UserProfile.savedataID,
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                }
            }).done(function (data) {
                decorateNewData(data);
                callback(null, data);
            }).fail(function (data) {
                callback(data);
            });
        },
        saveUserData: function (params, callback) {
            var saveData = decorateNewData(params.data);
            saveData._dataset = null;
            $.ajax({
                type: 'PUT',
                url: App.ServerUrl() + "/savedata/" + App.UserProfile.savedataID,
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                },
                data: { savedata: JSON.stringify(saveData) }
            }).done(function (data) {
                console.log("savedata");
                decorateNewData(data);
                callback(null, data);
            }).fail(function (data) {
                console.error("savedata failed", data);
                callback(data);
            });
        },
        getSyncInfo: function (params, callback) {
            $.ajax({
                type: 'GET',
                url: App.ServerUrl() + "/savedata/" + App.UserProfile.savedataID + "/sync",
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                }
            }).done(function (data) {
                console.log("sync.success");
                console.log(data, +new Date(data));
                callback(null, data);
            }).fail(function (data) {
                callback(data);
            });
        },
        checkOnlineState: function () {
            var deferred = $.Deferred();
            if (Info.isOnline()) {
                $.ajax({
                    type: "GET",
                    url: App.ServerUrl() + "/ping",
                }).done(function (data) {
                    //console.log("ping - success", data);
                    deferred.resolve(true);
                }).fail(function (data) {
                    //console.log("ping - failed");
                    deferred.resolve(false);
                });
            }
            else {
                deferred.resolve(false);
            }
            return deferred;
        },
        changePassword: function (changePasswordDataObject, callback) {
            console.log("changePassword start");
            $.ajax({
                type: 'PUT',
                url: App.ServerUrl() + "/students/password/" + App.UserProfile.id,
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                },
                data: changePasswordDataObject,
            }).done(function (data) {
                console.log("changePassword: success");
                callback(null, data);
            }).fail(function (data) {
                console.error("changePassword: failed");
                callback(data);
            });
        }
    };
    window.ServerFunctions = ServerFunctions;
    function decorateNewData(data) {
        console.log("decorating New Data ");
        if (data.hasOwnProperty("current_location_in_roadmap"))
            data.roadmapLocation = data.current_location_in_roadmap;
        data.current_location_in_roadmap = data.roadmapLocation;
        data.name = App.UserProfile.name;
        if (data._dataset) {
            if (data._dataset.value) {
                data.dataset = data._dataset.value;
            }
        }
        return data;
    }
    // DATA STORES ---------------------------------------------------------------------------
    // Creates data store types for the new and old administration
    // the switch is defined bu the localstorate variable: 'dk.frontread.user.usertype': praxis/frontread
    var DataStore = {
        API: function () {
            switch (config.data_store) {
                case DATA_STORE.data_store_offline_and_no_login_required:
                    return OfflineAndNoLoginRequired;
                case DATA_STORE.data_store_mobile_disc_only:
                    return DataStoreMobileDiscOnly;
                case DATA_STORE.mobile_offline_online_data_sync:
                    return this.getDataStoreMobileOfflineOnLine();
                case DATA_STORE.data_store_online:
                    return this.getDataStoreWeb();
            }
        },
        getDataStoreWeb: function () {
            if (UserData.getUserType() == "praxis") {
                return DataStoreUniLoginWeb;
            }
            else {
                console.info("DataStoreFactory - using PU");
                return DataStorePasswordsUsers;
            }
        },
        getDataStoreMobileOfflineOnLine: function () {
            if (UserData.getUserType() == "praxis") {
                console.info("DataStoreFactory - using MOONA");
                return DataStore_mobile_online_offline_NEW_Administration;
            }
            else {
                console.info("DatastoreFactory - using PA");
                return DataStorePasswordsUsers; //Work as web, login every time
            }
        },
        lockRetryTests: function (callback) {
            $.ajax({
                type: 'PUT',
                url: App.ServerUrl() + "/students/deleteretaketest/" + App.UserProfile.id,
                cache: true,
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                }
            }).done(function () {
                console.log("Retry test locked");
                callback(null);
            }).fail(function () {
                console.log("Retry test not locked");
                callback(true);
            });
        }
    };
    window.DataStore = DataStore;
    function launchIntoFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
        else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        }
        else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }
        else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    var DataStoreUniLoginWeb = {
        authenticated: false,
        onlineStatus: true,
        initialize: function () {
            var self = this;
            var deferred = $.Deferred();
            var params = getUrlParams();
            console.info("DataStoreFactory - UNI-Login initialize");
            config.can_change_password = false;
            // if the user have been authenticated on the uni login page
            // the user will have been redirected back to the web page
            // with some authentication parameters.
            if (params.user) {
                if (Authenticator.isAuthenticatedBy_UNI_web()) {
                    console.log("authenticating using unilogin url params");
                    //launchIntoFullscreen(document.documentElement); // the whole page
                    UserData.setUnicID(params.user);
                    var authenticationParams = {
                        unicID: UserData.getUnicID()
                    };
                    Authenticator.authenticateUni(authenticationParams, function (err, data) {
                        if (err) {
                            self.authenticated = false;
                            deferred.reject(data);
                        }
                        else {
                            //self.startOnlineMonitor(10000);
                            self.authenticated = true;
                            self.loadUserData().done(function (data) {
                                deferred.resolve(data);
                            }).fail(function (data) {
                                deferred.reject(data);
                            });
                        }
                    });
                }
                else {
                    deferred.reject();
                }
            }
            else {
                deferred.reject();
            }
            return deferred;
        },
        authenticate: function () {
            config.can_change_password = false;
            Authenticator.authenticate_UNI_web();
            return $.Deferred();
        },
        loadUserData: function () {
            var deferred = $.Deferred();
            //No saving when using administation1 users
            if (config.no_save) {
                $.getJSON("assets/json/data.json" + "?cb=" + (+new Date()), function (data) {
                    data.dataset = config.GetNoSaveDataset();
                    data.name = App.translate("demoapp");
                    App.userdata = data;
                    deferred.resolve(data);
                }).fail(function () {
                    deferred.reject();
                });
            }
            else {
                ServerFunctions.loadUserData(App.UserProfile, function (err, data) {
                    err ? deferred.reject() : deferred.resolve(data);
                });
            }
            return deferred;
        },
        saveUserData: function (data) {
            var deferred = $.Deferred();
            var params = {
                savedataID: App.UserProfile.savedataID,
                data: data
            };
            if (config.no_save) {
                deferred.resolve(App.userdata);
            }
            else {
                ServerFunctions.saveUserData(params, function (err, data) {
                    console.log("saveUserData 5: " + data);
                    err ? deferred.reject() : deferred.resolve(data);
                });
            }
            return deferred;
        },
        isOnline: function () {
            return Info.isOnline();
        },
        logout: function () {
            Authenticator.logout();
            this.authenticated = false;
        }
    };
    /*
     synkronosering af data, med online webservice
     frontread & unic mobil login
     */
    var DataStore_mobile_online_offline_NEW_Administration = {
        authenticated: false,
        initialize: function () {
            console.info("DataStoreFactory - MOONA initialize");
            return $.Deferred().reject();
        },
        authenticate: function (params) {
            config.can_change_password = false;
            var deferred = $.Deferred();
            var self = this;
            // 1. login with unic
            Authenticator.authenticate_UNI_mobile(params.username, params.password, function (err, data) {
                // 2. login with new frontread.
                if (err)
                    deferred.reject(data);
                else {
                    var authenticationParams = {
                        unicID: UserData.getUnicID()
                    };
                    Authenticator.authenticateUni(authenticationParams, function (err, data) {
                        if (err) {
                            self.authenticated = false;
                            deferred.reject(data);
                        }
                        else {
                            //self.startOnlineMonitor(10000);
                            self.authenticated = true;
                            self.loadUserData().done(function (data) {
                                deferred.resolve(data);
                            }).fail(function (data) {
                                deferred.reject(data);
                            });
                        }
                    });
                }
            });
            return deferred;
        },
        /* @public */
        loadUserData: function () {
            var deferred = $.Deferred();
            //No saving when using administation1 users
            if (config.no_save) {
                $.getJSON("assets/json/data.json" + "?cb=" + (+new Date()), function (data) {
                    data.dataset = config.GetNoSaveDataset();
                    data.name = App.translate("demoapp");
                    App.userdata = data;
                    deferred.resolve(data);
                }).fail(function () {
                    deferred.reject();
                });
            }
            else {
                ServerFunctions.loadUserData(App.UserProfile, function (err, data) {
                    err ? deferred.reject() : deferred.resolve(data);
                });
            }
            return deferred;
        },
        saveUserData: function (data) {
            var deferred = $.Deferred();
            var params = {
                savedataID: App.UserProfile.savedataID,
                data: data
            };
            if (config.no_save) {
                deferred.resolve(App.userdata);
            }
            else {
                ServerFunctions.saveUserData(params, function (err, data) {
                    console.log("saveUserData 6: " + data);
                    err ? deferred.reject() : deferred.resolve(data);
                });
            }
            return deferred;
        },
        // private --------------------------------------------------
        syncData: function (deferred, userdata) {
            console.log("syncData");
            var self = this;
            var saveParams = {
                savedataID: App.UserProfile.savedataID,
                data: userdata
            };
            self._compareLocalAndServerData(userdata).done(function (syncdata) {
                // The sync date on client/server is the same, so we will save the data on the server and in the filesystem.
                if (syncdata.status == config.sync_state_new_data) {
                    console.log("Server.wrapper - push file to server");
                    if (self.isOnline()) {
                        ServerFunctions.saveUserData(saveParams, function (err, data) {
                            CordovaFileSystem._writeFile(App.UserProfile.getFileName(), data, function (err, result) {
                                deferred.resolve(data);
                            });
                        });
                    }
                    else {
                        CordovaFileSystem._writeFile(App.UserProfile.getFileName(), userdata, function (err, result) {
                            deferred.resolve(userdata);
                        });
                    }
                }
                else {
                    console.info("Data out of sync..");
                    ServerFunctions.loadUserData(App.UserProfile, function (err, serverData) {
                        var mergedDocument = App.request("entities:userdata:merge", userdata, serverData);
                        saveParams.data = mergedDocument;
                        ServerFunctions.saveUserData(saveParams, function (err, data) {
                            CordovaFileSystem._writeFile(App.UserProfile.getFileName(), data, function (err, result) {
                                if (err)
                                    deferred.reject();
                                else {
                                    console.log("- filsystem: save Success");
                                    deferred.resolve(data);
                                }
                            });
                        });
                    });
                }
            });
        },
        _compareLocalAndServerData: function (userdata) {
            var status = 0;
            var deferred = $.Deferred();
            var self = this;
            var synchParams = {
                savedataID: App.UserProfile.savedataID
            };
            if (this.isOnline()) {
                ServerFunctions.getSyncInfo(synchParams, function (err, strDateUpdated) {
                    console.log("compareLocalAndServerData, local:", self.toNumber(userdata.updated), "server:", self.toNumber(strDateUpdated));
                    if (self.toNumber(userdata.updated) == self.toNumber(strDateUpdated))
                        status = config.sync_state_new_data;
                    else
                        status = config.sync_state_outofdate;
                    deferred.resolve({ status: status /*, syncdata: data*/ });
                });
            }
            else {
                status = config.sync_state_new_data;
                deferred.resolve({ status: status /*, syncdata: data*/ });
            }
            return deferred;
        },
        toNumber: function (dateString) {
            return +new Date(dateString);
        },
        isOnline: function () {
            return Info.isOnline();
        },
        logout: function () {
            this.authenticated = false;
            Authenticator.logout();
        }
    };
    /*
     Altid online,
     frontread & unic web login
     */
    var DataStorePasswordsUsers = {
        authenticated: false,
        onlineStatus: true,
        initialize: function () {
            console.info("DataStoreFactory - PU initialize");
            return $.Deferred().reject();
        },
        authenticate: function (params) {
            var deferred = $.Deferred();
            var self = this;
            config.can_change_password = true;
            Authenticator.autenticate_frontread(params.username, params.password, function (err, data) {
                if (err) {
                    deferred.reject(data);
                    console.error("DataStorePasswordsUsers autenticate_frontread " + err + ", " + JSON.stringify(data));
                }
                else {
                    self.startOnlineMonitor(10000);
                    self.authenticated = true;
                    self.loadUserData().done(function (data) {
                        deferred.resolve(data);
                    }).fail(function () {
                        console.error("DataStorePasswordsUsers load " + JSON.stringify(data));
                        deferred.reject(data);
                    });
                }
            });
            return deferred;
        },
        loadUserData: function () {
            var deferred = $.Deferred();
            //No saving when using administation1 users
            if (config.no_save) {
                $.getJSON("assets/json/data.json" + "?cb=" + (+new Date()), function (data) {
                    data.dataset = config.GetNoSaveDataset();
                    data.name = App.translate("demoapp");
                    App.userdata = data;
                    deferred.resolve(data);
                }).fail(function () {
                    deferred.reject();
                });
            }
            else {
                ServerFunctions.loadUserData(App.UserProfile, function (err, data) {
                    err ? deferred.reject() : deferred.resolve(data);
                });
            }
            return deferred;
        },
        changePassword: function (changePasswordDataObject) {
            console.info("DataStorePasswordsUsers changePassword");
            var deferred = $.Deferred();
            ServerFunctions.changePassword(changePasswordDataObject, function (err, data) {
                err ? deferred.reject() : deferred.resolve(data);
            });
            return deferred;
        },
        saveUserData: function (data) {
            var deferred = $.Deferred();
            var params = {
                savedataID: App.UserProfile.savedataID,
                data: data
            };
            if (config.no_save) {
                deferred.resolve(App.userdata);
            }
            else {
                ServerFunctions.saveUserData(params, function (err, data) {
                    //console.log("saveUserData 1: " + params);
                    //console.log("saveUserData 2: " + data);
                    err ? deferred.reject() : deferred.resolve(data);
                });
            }
            return deferred;
        },
        isOnline: function () {
            return Info.isOnline();
        },
        logout: function () {
            this.authenticated = false;
            Authenticator.logout();
        },
        startOnlineMonitor: function (delay) {
            var self = this;
            setTimeout(function () {
                ServerFunctions.checkOnlineState().done(function (isOnline) {
                    if (isOnline !== self.onlineStatus) {
                        self.onlineStatus = isOnline;
                        App.isOnline = isOnline;
                        App.vent.trigger("device-network-status-changed");
                    }
                    if (self.authenticated)
                        self.startOnlineMonitor(10000);
                });
            }, delay);
        },
    };
    var DataStoreMobileDiscOnly = {
        authenticated: true,
        initialize: function () {
            console.log('DataStoreMobileDiscOnly.initialize');
            var deferred = $.Deferred();
            deferred.resolve();
            return deferred;
        },
        loadUserData: function (callback) {
            var self = this;
            var deferred = $.Deferred();
            CordovaFileSystem._readFile("userdata", function (err, data) {
                if (err || data == "") {
                    console.log("cant find file, attempting to load initial copy from assets/json/data.json");
                    // if the files dosent exist we will load the local resource
                    // and then save it localy.
                    $.getJSON("assets/json/data.json" + "?cb=" + (+new Date())).done(function (data) {
                        data = (typeof data == "string") ? JSON.parse(data) : data;
                        App.userdata = data;
                        CordovaFileSystem._writeFile("userdata", data, function (err, status) {
                            deferred.resolve(App.userdata);
                        });
                    });
                }
                else {
                    App.userdata = data;
                    deferred.reject(App.userdata);
                }
            });
            return deferred;
        },
        saveUserData: function (data, callback) {
            var deferred = $.Deferred();
            CordovaFileSystem._writeFile("userdata", data, function (err, status) {
                App.userdata = data;
                err ? deferred.reject() : deferred.resolve(data);
            });
            return deferred;
        },
        isOnline: function () {
            return Info.isOnline();
        },
        logout: function () {
            this.authenticated = false;
        }
    };
    ///No contact to disc or server for save
    var OfflineAndNoLoginRequired = {
        authenticated: true,
        initialize: function () {
            console.log('OfflineAndNoLoginRequired.initialize');
            var deferred = $.Deferred();
            deferred.resolve();
            return deferred;
        },
        loadUserData: function (callback) {
            console.log('OfflineAndNoLoginRequired.loadUserData');
            var deferred = $.Deferred();
            $.getJSON("assets/json/data.json" + "?cb=" + (+new Date())).done(function (data) {
                data.dataset = config.GetNoSaveDataset();
                App.userdata = data;
                deferred.resolve(data);
            }).fail(function () {
                deferred.reject();
            });
            return deferred;
        },
        saveUserData: function (data, callback) {
            var deferred = $.Deferred();
            deferred.resolve(App.userdata);
            return deferred;
        },
        isOnline: function () {
            return Info.isOnline();
        },
        logout: function () {
            self.authenticated = false;
        }
    };
    //window.DataStore 		 = DataStore;
    window.UserProfile = App.UserProfile;
    window.Authenticator = Authenticator;
    window.CordovaFileSystem = CordovaFileSystem;
})();
//# sourceMappingURL=datastore.js.map;
 /***************************/ 
App.module("Entities.DataAccess", function (DataAccess, App, _Backbone, Marionette, $, _) {
    App.reqres.setHandler("entities:dataAccess:loadDocument", function (filePath) {
        return new JSONLoader(filePath);
    });
});
//# sourceMappingURL=entities.dataaccess.js.map;
 /***************************/ 
App.module("Entities.StaticData", function (StaticData, App, _Backbone, Marionette, $, _) {
    var videoPath = "assets/video/";
    var imagesPath = "assets/images/";
    StaticData.videos = [
        {
            id: 1,
            src: videoPath + "{0}/intro.mp4",
            poster: videoPath + "{0}/intro.jpg",
            youtubeId: "D8_wRMNWkpg",
        },
        {
            id: 2,
            src: videoPath + "{0}/starttest.mp4",
            poster: videoPath + "{0}/starttest.jpg",
            youtubeId: "xhn5Z-fwCEA",
        },
        {
            id: 3,
            src: videoPath + "{0}/fiksering.mp4",
            poster: videoPath + "{0}/fiksering.jpg",
            youtubeId: "LS5buJPy1Uk",
        },
        {
            id: 4,
            src: videoPath + "{0}/spaendvidde.mp4",
            poster: videoPath + "{0}/spaendvidde.jpg",
            youtubeId: "xhn5Z-fwCEA",
        },
        {
            id: 5,
            src: videoPath + "{0}/arbejdshukommelsen.mp4",
            poster: videoPath + "{0}/arbejdshukommelsen.jpg",
            youtubeId: "D8_wRMNWkpg",
        },
        {
            id: 6,
            src: videoPath + "{0}/laesetraening.mp4",
            poster: videoPath + "{0}/laesetraening.jpg",
            youtubeId: "D8_wRMNWkpg",
        },
        {
            id: 7,
            src: videoPath + "{0}/mental_energi.mp4",
            poster: videoPath + "{0}/mental_energi.jpg",
            youtubeId: "xhn5Z-fwCEA",
        },
        {
            id: 8,
            src: videoPath + "{0}/pauser.mp4",
            poster: videoPath + "{0}/pauser.jpg",
            youtubeId: "LS5buJPy1Uk",
        },
        {
            id: 9,
            src: videoPath + "{0}/opsamling.mp4",
            poster: videoPath + "{0}/opsamling.jpg",
            youtubeId: "D8_wRMNWkpg",
        }
    ];
    App.datasetInfo = [
        {
            datasets: ["dan_vikings", "mellemtrin", "skole5_6", "skole7_10", "eud", "dan_being_pressured", "dan_egil_adventure"],
            posters: "dan"
        },
        {
            datasets: ["frontread"],
            posters: "dan"
        },
        {
            datasets: ["deu_biodiversity", "deu_wwf"],
            posters: "deu"
        },
        {
            datasets: ["eng_seasons"],
            posters: "eng"
        },
        {
            datasets: ["nor_bokmaal_udskoling"],
            posters: "nor"
        }
    ];
    /**
     *  Get the video based on the current dataSet and language.
     *  @param id video id.
     *  @return object {src:String, poster:String}
     */
    App.reqres.setHandler("getVideoByID", function (id) {
        var data = {
            videos: StaticData.videos,
            folders: App.datasetInfo,
            dataset: App.userdata.dataset
        };
        return DataManager.getVideoByID(id, data);
    });
    StaticData.f4 = [
        { id: "m1/1/1", filePath: "assets/json/@dataset/f4/txt-1.json" },
        { id: "m1/1/2", filePath: "assets/json/@dataset/f4/txt-2.json" },
        { id: "m1/1/3", filePath: "assets/json/@dataset/f4/txt-3.json" },
        { id: "m1/1/4", filePath: "assets/json/@dataset/f4/txt-4.json" },
        { id: "m1/2/1", filePath: "assets/json/@dataset/f4/txt-5.json" },
        { id: "m1/2/2", filePath: "assets/json/@dataset/f4/txt-6.json" },
        { id: "m1/2/3", filePath: "assets/json/@dataset/f4/txt-7.json" },
        { id: "m1/2/4", filePath: "assets/json/@dataset/f4/txt-8.json" },
        { id: "m1/3/1", filePath: "assets/json/@dataset/f4/txt-9.json" },
        { id: "m1/3/2", filePath: "assets/json/@dataset/f4/txt-10.json" },
        { id: "m1/3/3", filePath: "assets/json/@dataset/f4/txt-11.json" },
        { id: "m1/3/4", filePath: "assets/json/@dataset/f4/txt-12.json" },
        { id: "m2/4/1", filePath: "assets/json/@dataset/f4/txt-13.json" },
        { id: "m2/4/2", filePath: "assets/json/@dataset/f4/txt-14.json" },
        { id: "m2/4/3", filePath: "assets/json/@dataset/f4/txt-15.json" },
        { id: "m2/4/4", filePath: "assets/json/@dataset/f4/txt-16.json" },
        { id: "m2/5/1", filePath: "assets/json/@dataset/f4/txt-17.json" },
        { id: "m2/5/2", filePath: "assets/json/@dataset/f4/txt-18.json" },
        { id: "m2/5/3", filePath: "assets/json/@dataset/f4/txt-19.json" },
        { id: "m2/5/4", filePath: "assets/json/@dataset/f4/txt-20.json" },
        { id: "m2/6/1", filePath: "assets/json/@dataset/f4/txt-21.json" },
        { id: "m2/6/2", filePath: "assets/json/@dataset/f4/txt-22.json" },
        { id: "m2/6/3", filePath: "assets/json/@dataset/f4/txt-23.json" },
        { id: "m2/6/4", filePath: "assets/json/@dataset/f4/txt-24.json" },
        { id: "m3/7/1", filePath: "assets/json/@dataset/f4/txt-25.json" },
        { id: "m3/7/2", filePath: "assets/json/@dataset/f4/txt-26.json" },
        { id: "m3/7/3", filePath: "assets/json/@dataset/f4/txt-27.json" },
        { id: "m3/7/4", filePath: "assets/json/@dataset/f4/txt-28.json" },
        { id: "m3/8/1", filePath: "assets/json/@dataset/f4/txt-29.json" },
        { id: "m3/8/2", filePath: "assets/json/@dataset/f4/txt-30.json" },
        { id: "m3/8/3", filePath: "assets/json/@dataset/f4/txt-31.json" },
        { id: "m3/8/4", filePath: "assets/json/@dataset/f4/txt-32.json" },
        { id: "m3/9/1", filePath: "assets/json/@dataset/f4/txt-33.json" },
        { id: "m3/9/2", filePath: "assets/json/@dataset/f4/txt-34.json" },
        { id: "m3/9/3", filePath: "assets/json/@dataset/f4/txt-35.json" },
        { id: "m3/9/4", filePath: "assets/json/@dataset/f4/txt-36.json" }
    ];
    StaticData.tests = [
        { id: "t1", filePath: "assets/json/@dataset/tests/txt-1.json" },
        { id: "t2", filePath: "assets/json/@dataset/tests/txt-2.json" },
        { id: "t3", filePath: "assets/json/@dataset/tests/txt-3.json" },
        { id: "t4", filePath: "assets/json/@dataset/tests/txt-4.json" }
    ];
    StaticData.exerciseConfiguration = {
        f1: {
            blinkSpeed: 400
        },
        f2: {
            blinkSpeed: 400
        },
        f3: {
            blinkSpeed: 400
        },
        f4: {
            fileName: "f4.02.json",
            basePath: "assets/json/@dataset/f4/",
            wpm: 150,
            filePath: function () {
                return this.basePath + this.fileName;
            }
        },
        t1: {
            fileName: "t1.01.json",
            basePath: "assets/json/@dataset/t1/",
            filePath: function () {
                return this.basePath + this.fileName;
            }
        }
    };
    StaticData.modulesSettings = [
        {
            moduleID: "m1", levels: [
                {
                    level: "1", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 300, numChareters: 3 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 1, width: 314, isList: false } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 1, numOptions: 4 } }
                    ]
                },
                {
                    level: "2", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 300, numChareters: 3 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 2, width: 314, isList: false } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 2, numOptions: 4 } }
                    ]
                },
                {
                    level: "3", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 200, numChareters: 3 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 4, width: 314, isList: true } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 3, numOptions: 4 } }
                    ]
                }
            ]
        },
        {
            moduleID: "m2", levels: [
                {
                    level: "4", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 300, numChareters: 4 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 2, width: 400, isList: false } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 2, numOptions: 5 } }
                    ]
                },
                {
                    level: "5", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 300, numChareters: 4 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 3, width: 400, isList: false } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 3, numOptions: 5 } }
                    ]
                },
                {
                    level: "6", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 200, numChareters: 4 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 6, width: 400, isList: true } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 3, numOptions: 5 } }
                    ]
                }
            ]
        },
        {
            moduleID: "m3", levels: [
                {
                    level: "7", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 300, numChareters: 5 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 3, width: 503, isList: false } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 3, numOptions: 6 } }
                    ]
                },
                {
                    level: "8", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 300, numChareters: 5 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 4, width: 503, isList: false } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 4, numOptions: 6 } }
                    ]
                },
                {
                    level: "9", exercises: [
                        { exerciseID: "f1", settings: { blinkSpeed: 200, numChareters: 5 } },
                        { exerciseID: "f2", settings: { blinkSpeed: 300, numChareters: 8, width: 600, isList: true } },
                        { exerciseID: "f3", settings: { blinkSpeed: 300, numChareters: 4, numOptions: 6 } }
                    ]
                }
            ]
        }
    ];
});
//# sourceMappingURL=entities.staticdata.js.map;
 /***************************/ 
App.module("Entities.UserData", function (UserData, App, _Backbone, Marionette, $, _) {
    /*
     * Select fra user data med query strings:
     * ---------------------------------------
     *
     *		Module query parms in order:
     *		- module
     *		- level
     *		- exercise
     *		- attempt
     *
     *		Modules:
     *			module:  m1/m2/m3/m4,
     *			level:   1-9,
     *			exercise: f1/f2/f3/f4,
     *			attempt:  1- 4
     *
     *		Tests:
     *			module:t1/t2/t3/t4
     *
     *	@example:
     *		var key = "module:m1, level:1, exercise:f3, attempt:4";
     *		App.request("entities:data:query", key2);
     *
     *		var key = "module:m1, level:1, exercise:f3, attempt:4";
     *		App.request("entities:data:query", key2);
     */
    App.reqres.setHandler("entities:data:query", function (query) {
        return querryData(query);
    });
    App.reqres.setHandler("entities:build:query", function () {
        return dataQueryBuilder.apply(null, arguments);
    });
    App.commands.setHandler("entities:data:save", function () {
        Server.saveUserData();
    });
    App.reqres.setHandler("entities:wpm-by-level", function () {
        var wpmFallback = 120;
        var bestWPM = App.request("entities:best-wpm");
        if (bestWPM == 0) {
            bestWPM = wpmFallback;
        }
        var levelCounter = App.currentLevel;
        var levelModulo = levelCounter % 3; //Split the levels into first, second, and third in every module
        var increaseFactor = 1;
        if (levelModulo === 1) { //First level in every module is increased by 10 %
            increaseFactor = 1.1;
        }
        else if (levelModulo === 2) { //Second level in every module is increased by 20 %
            increaseFactor = 1.2;
        }
        else if (levelModulo === 0) { //Third level in every module is increased by 30 %. We chose 30 since, on average, the user will have increased their reading speed by 38 % after completing the first milestone
            increaseFactor = 1.3;
        }
        return Math.floor(bestWPM * increaseFactor);
    });
    App.reqres.setHandler("entities:best-wpm", function () {
        var wpmLimit = 1200;
        var bestWPM = 0;
        _.each(App.userdata.tests, function (testdata) {
            if (testdata.wpm && testdata.isComplete && testdata.wpm < wpmLimit) {
                bestWPM = Math.max(bestWPM, testdata.wpm); //Get the highest wpm that's below 1200
            }
        });
        return bestWPM;
    });
    App.reqres.setHandler("entities:wpm-increase", function (userdata) {
        if (userdata) {
            console.error("Userdata should not be send, this might be a problem");
        }
        userdata = userdata ? userdata : App.userdata;
        var start = userdata.tests[0].wpm;
        if (start == 0) {
            return 0;
        }
        else {
            var now = App.request("entities:latest-wpm-from-tests");
            return Math.round(Math.round((now - start) / start * 100));
        }
    });
    App.reqres.setHandler("entities:latest-wpm-from-tests", function () {
        var wpm = 0;
        _.each(App.userdata.tests, function (test) {
            if (test.wpm && test.isComplete && test.wpm < 1200) {
                wpm = test.wpm;
            }
        });
        return wpm;
    });
    App.commands.setHandler("save:userResponses", function (data) {
        if (App.currentExercise.indexOf("f") > -1) {
            var query = "module:{0}, level:{1}, exercise:{2}, attempt:{3}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise, App.currentAttempt.toString());
            console.log("saving responses, query:", query, "data:", data);
            App.request("entities:data:query", query).userResponses = data;
        }
        else {
            var query = "module:{0}".format(App.currentModule);
            App.request("entities:data:query", query).userResponses = data;
        }
    });
    App.reqres.setHandler("get:saved:responses", function (module, level, exercise, attempt) {
        // Do not trust input types when using message passing
        module = module && module.toString();
        level = level && parseInt(level.toString());
        exercise = exercise && exercise.toString();
        attempt = attempt && parseInt(attempt.toString());
        if (!App.currentModule) {
            if (module) {
                App.currentModule = module;
            }
            else {
                App.currentModule = _Backbone.history.getFragment().match(/t\d/)[0];
                console.log("Backbone.history.fragment currentModule " + App.currentModule);
            }
        }
        if (!App.currentLevel) {
            if (level) {
                App.currentLevel = level;
            }
            else {
                App.currentLevel = parseInt(_Backbone.history.getFragment().match(/\/\d/)[0][1]);
                console.log("Backbone.history.fragment currentLevel " + App.currentLevel);
            }
        }
        if (!App.currentExercise) {
            App.currentExercise = exercise;
        }
        if (!App.currentAttempt) {
            App.currentAttempt = attempt;
        }
        module = module || App.currentModule;
        level = level || App.currentLevel;
        exercise = exercise || App.currentExercise;
        attempt = attempt || App.currentAttempt;
        var query = "";
        var result = [];
        if (App.currentModule.indexOf("m") > -1) {
            query = "module:{0}, level:{1}, exercise:{2}".format(module, level.toString(), exercise);
            result = get_userResponses_from_lastOccuranceOfUseresponses_in_exercise(query);
            //var attempts = App.request("entities:data:query", query).attempts;
            //result = attempts;
        }
        else if (App.currentModule.indexOf("t") > -1) {
            query = "module:{0}".format(App.currentModule);
            result = App.request("entities:data:query", query).userResponses || [];
        }
        else {
            console.warn("no data here");
        }
        return result;
    });
    App.reqres.setHandler("entities:isRetaking", function (module, level) {
        // Do not trust input types when using message passing
        module = module && module.toString() || App.currentModule;
        level = level && parseInt(level.toString()) || App.currentLevel;
        var data = App.request("entities:data:query", "module:{0}, level:{1}".format(module, level.toString()));
        var isRetaking = true;
        if (/t\d/.test(module)) {
            return data.wpm != 0;
        }
        else {
            _.each(data.exercises, function (exercise) {
                _.each(exercise.attempts, function (attempt) {
                    if (!attempt.blinkspeed)
                        isRetaking = false;
                });
            });
        }
        return isRetaking;
    });
    App.reqres.setHandler("entities:isLevelComplete", function (module, level) {
        // Do not trust input types when using message passing
        module = module && module.toString() || App.currentModule;
        level = level && parseInt(level.toString()) || App.currentLevel;
        //console.log("entities:isLevelComplete module:", module, "level:", level);
        var data = App.request("entities:data:query", "module:{0}, level:{1}".format(module, level.toString()));
        var isComplete = true;
        if (/t\d/.test(module)) {
            return data.isComplete;
        }
        else {
            _.each(data.exercises, function (exercise) {
                _.each(exercise.attempts, function (attempt) {
                    if (!attempt.isComplete)
                        isComplete = false;
                });
            });
        }
        return isComplete;
    });
    App.commands.setHandler("entities:setLevelToComplete", function (module, level) {
        // Do not trust input types when using message passing
        module = module && module.toString();
        level = module && parseInt(level.toString());
        var data = App.request("entities:data:query", "module:{0}, level:{1}".format(module, level.toString()));
        _.each(data.exercises, function (exercise) {
            _.each(exercise.attempts, function (attempt) {
                attempt.isComplete = true;
            });
        });
    });
    //FIXME: Remove this handler? Only referenced in developer.show.ts
    // TestData - sets a module to complete.
    // App.execute("entities:exercise:setComplete",  "m1", "1", "f1")
    App.commands.setHandler("entities:exercise:setComplete", function (module, level, exercise) {
        // Do not trust input types when using message passing
        module = module && module.toString();
        level = level && parseInt(level.toString());
        exercise = exercise && exercise.toString();
        var attempts = App.request("entities:data:query", "module:{0}, level:{1}, exercise:{2}".format(module, level.toString(), exercise)).attempts;
        for (var i in attempts) {
            attempts[i] = {
                "isComplete": true,
                "blinkSpeed": 0.4,
                "correctCount": 10,
                "wrongCount": 0,
                "wordCount": 10,
                "date": "",
                "userResponses": [
                    {
                        text: "Developer created data - [attempt: {0}]".format((parseInt(i) + 1)), responses: [
                            { text: "Developer data", state: "correct" },
                            { text: "Developer data", state: "" },
                            { text: "Developer data", state: "" }
                        ]
                    },
                    {
                        text: "Developer created data - [attempt: {0}]".format((parseInt(i) + 1)), responses: [
                            { text: "Developer data", state: "wrong" },
                            { text: "Developer data", state: "" },
                            { text: "Developer data", state: "" }
                        ]
                    },
                    {
                        text: "Developer created data - [attempt: {0}]".format((parseInt(i) + 1)), responses: [
                            { text: "Developer data", state: "correct" },
                            { text: "Developer data", state: "" },
                            { text: "Developer data", state: "" }
                        ]
                    },
                    {
                        text: "Developer created data - [attempt: {0}]".format((parseInt(i) + 1)), responses: [
                            { text: "Developer data", state: "correct" },
                            { text: "Developer data", state: "" },
                            { text: "Developer data", state: "" }
                        ]
                    }
                ]
            };
        }
    });
    App.commands.setHandler("entities:exercise:setInComplete", function (module, level, exercise) {
        // Do not trust input types when using message passing
        module = module && module.toString();
        level = level && parseInt(level.toString());
        exercise = exercise && exercise.toString();
        var attempts = App.request("entities:data:query", "module:{0}, level:{1}, exercise:{2}".format(module, level.toString(), exercise)).attempts;
        for (var i in attempts) {
            attempts[i] = {
                "isComplete": false,
                "blinkSpeed": "",
                "correctCount": "",
                "wrongCount": 0,
                "wordCount": 0,
                "date": "",
                "userResponses": []
            };
        }
    });
    App.commands.setHandler("entities:data:show", function () {
    });
    App.reqres.setHandler("entities:exercises:isAllF4ExercisesComplete", function () {
        var allComplete = true;
        _.each(App.userdata.modules, function (module) {
            _.each(module.levels, function (levels) {
                _.each(levels.exercises[3].attempts, function (attempt) {
                    if (!attempt.isComplete)
                        allComplete = false;
                });
            });
        });
        return allComplete;
    });
    App.reqres.setHandler("entities:exercises:isAllComplete", function () {
        var allComplete = true;
        _.each(App.userdata.modules, function (module) {
            var moduleID = module.moduleID;
            // if any level is non complete the isAllComplete will be sat to false.
            _.each(module.levels, function (level) {
                var levelID = level.level;
                if (!App.request("entities:isLevelComplete", moduleID, levelID))
                    allComplete = false;
            });
        });
        return allComplete;
    });
    // HELPERS -------------------------------------------------------------------------------
    // automatic build the data query string based on the number of arguments.
    function dataQueryBuilder() {
        var queryString = "";
        var fragments = "module:{0}, level:{1}, exercise:{2}, attempt:{3}".split(",");
        // For each argument passed in to the function a fragment will be added  untill a maximum of 4 arguments.
        for (var i = 0; i < arguments.length; i++) {
            queryString += fragments[i] + ",";
        }
        // remove trailing comma
        queryString = queryString.substring(0, queryString.length - 1);
        return queryString.format.apply(queryString, arguments);
    }
    function get_userResponses_from_lastOccuranceOfUseresponses_in_exercise(query) {
        var attempts = App.request("entities:data:query", query).attempts;
        var userResponses = [];
        for (var i in attempts) {
            if (attempts[i].userResponses.length) {
                userResponses = attempts[i].userResponses;
            }
        }
        return userResponses;
    }
    function isTest(value) {
        return /t\d/.test(value);
    }
    function querryData(query) {
        var data = {};
        var params = zoo.strings.toObject(query);
        if (isTest(query)) {
            data = getTestByID(params.module);
        }
        else {
            if (params.hasOwnProperty("module"))
                data = getModuleByID(params.module);
            if (params.hasOwnProperty("level"))
                data = getLevelByID(params.level, data);
            if (params.hasOwnProperty("exercise"))
                data = getExerciseByID(params.exercise, data);
            if (params.hasOwnProperty("attempt"))
                data = getExerciseAttemptByIndex(params.attempt, data);
        }
        return data;
    }
    function getModuleByID(moduleID) {
        return _.find(App.userdata.modules, function (module) {
            return module.moduleID == moduleID;
        });
    }
    function getLevelByID(levelID, data) {
        return _.find(data.levels, function (objLevel) {
            return objLevel.level == levelID;
        });
    }
    function getExerciseByID(exerciseID, data) {
        return _.find(data.exercises, function (exercise) {
            return exercise.exerciseID == exerciseID;
        });
    }
    function getExerciseAttemptByIndex(index, data) {
        return data.attempts[parseInt(index) - 1];
    }
    function getTestByID(id) {
        return _.find(App.userdata.tests, function (test) {
            return test.testID == id;
        });
    }
});
//# sourceMappingURL=entities.userdata.js.map;
 /***************************/ 
App.module("Entities.UserData.Merge", function (Merge, App, _Backbone, Marionette, $, _) {
    App.reqres.setHandler("entities:userdata:merge", function (documentA, documentB) {
        return mergeUserData(documentA, documentB);
    });
    App.reqres.setHandler("entities:userdata:stats", function (data) {
        return getUserDataStats(data);
    });
    function mergeUserData(documentA, documentB) {
        // get stats on each document
        var statsA = getUserDataStats(documentA);
        var statsB = getUserDataStats(documentB);
        // Creat a new document by merging the two documents together overriding any dubliants with the document with the most progress.
        var resultA = statsA.numTestsCompleted + statsA.numExercisesCompleted;
        var resultB = statsB.numTestsCompleted + statsB.numExercisesCompleted;
        var mergedDocument = {};
        if (resultA < resultB)
            mergedDocument = $.extend(true, {}, documentA, documentB);
        else
            mergedDocument = $.extend(true, {}, documentB, documentA);
        // make sure that the syncdate exists.
        documentA.syncdate = documentA.hasOwnProperty("syncdate") ? documentA.syncdate : 0;
        documentB.syncdate = documentB.hasOwnProperty("syncdate") ? documentB.syncdate : 0;
        var syncdate = (documentA.syncdate > documentB.syncdate) ? documentA.syncdate : documentB.syncdate;
        mergedDocument.syncdate = syncdate;
        // recalculating the wpm.
        //var newWpm = App.request("entities:wpm-increase", mergedDocument);
        //mergedDocument.wpm = newWpm;
        mergedDocument.wpm = App.request("entities:latest-wpm-from-tests");
        return mergedDocument;
    }
    ;
    function getUserDataStats(data) {
        var tests = data.tests;
        var modules = data.modules;
        var numExercises = 0;
        var numExercisesComplete = 0;
        var numTests = 0;
        var numTestComplete = 0;
        _.each(modules, function (module) {
            _.each(module.levels, function (level) {
                _.each(level.exercises, function (exercise) {
                    _.each(exercise.attempts, function (attempt) {
                        if (attempt.isComplete)
                            numExercisesComplete++;
                        numExercises++;
                    });
                });
            });
        });
        _.each(tests, function (test) {
            if (test.isComplete)
                numTestComplete++;
            numTests++;
        });
        var data = {
            wpm: data.wpm,
            numTests: numTests,
            numTestsCompleted: numTestComplete,
            numExercises: numExercises,
            numExercisesCompleted: numExercisesComplete
        };
        return data;
    }
    ;
});
//# sourceMappingURL=entities.userdata.merge.js.map;
 /***************************/ 
App.module("Entities", function (Entities, App, _Backbone, Marionette, $, _) {
    // set  ----------------------------------------------------------
    App.commands.setHandler("configure:exercise", function (id, options) {
        configureExersice(id, options);
    });
    // get  ----------------------------------------------------------
    App.reqres.setHandler("configuration:exercise", function (id) {
        return getConfiguration(id);
    });
    // Get the configuration for the module/level/exercise
    App.reqres.setHandler("configuration:exercise:niveau", function (module, level, exercise) {
        level = level || App.currentLevel;
        module = module || App.currentModule;
        exercise = exercise || App.currentExercise;
        return getNiveauSettings(module, level, exercise);
    });
    // Auto generates data for f1-f3
    App.reqres.setHandler("exercise:data", function (module, level, exercise) {
        level = level || App.currentLevel;
        module = module || App.currentModule;
        exercise = exercise || App.currentExercise;
        return createExerciseData(module.toString(), parseInt(level), exercise.toString());
    });
    // Get the f4 text for the module/level/attempt
    App.reqres.setHandler("exercise:data:p4", function (module, level, attempt) {
        module = module || App.currentModule;
        level = level || App.currentLevel;
        attempt = attempt || App.currentAttempt;
        var path = _.find(Entities.StaticData.f4, function (obj) {
            return obj.id == (module + "/" + level + "/" + attempt);
        }).filePath;
        return replaceDataSetPath(path);
    });
    App.reqres.setHandler("exercise:data:tests", function (module) {
        module = module || App.currentModule;
        var path = _.find(Entities.StaticData.tests, function (obj) {
            return obj.id == module;
        }).filePath;
        return replaceDataSetPath(path);
    });
    // Helpers ------------------------------------------------------
    function replaceDataSetPath(path) {
        return path.replace("@dataset", App.userdata.dataset) + ("?" + Math.ceil((Math.random() * 9999)) + (+new Date()));
        /* Cache buster */
    }
    function createRandomWrongCount(max) {
        var wrongPrecentage = 60;
        var minPosibleItemsNotEqualToParent = 1;
        var maxPosibleItemsNotEqualToTheParent = max / 100 * wrongPrecentage >> 0;
        return zoo.random.intInRange(minPosibleItemsNotEqualToParent, maxPosibleItemsNotEqualToTheParent);
    }
    function ReplaceAt(stringSend, index, replacement) {
        return stringSend.substr(0, index) + replacement + stringSend.substr(index + replacement.length);
    }
    var CANDIDATES = "bcdefgijklmoprtuvxz";
    /*
        "qwertyuiop" +
        "asdfghjkl" +
        "zxcvbnm"; */ //"bcdefgijklmoprtuvxz"
    function LetterArrayThatIsNot(excludedLetters, returnLength) {
        var localCandidates = CANDIDATES;
        for (var i = 0; i < excludedLetters.length; i++) {
            localCandidates = localCandidates.replace(excludedLetters[i], "");
        }
        return OrderUniqueString(returnLength, localCandidates);
    }
    function OrderUniqueString(length, candidates) {
        if (candidates.length < length) {
            new Error("OrderUniqueString to long " + length);
            return "";
        }
        var uniqueString = "";
        while (uniqueString.length < length) {
            var candidate = candidates[Math.floor(Math.random() * candidates.length)];
            if (uniqueString.indexOf(candidate) == -1) {
                uniqueString += candidate;
            }
        }
        return uniqueString;
    }
    function createExerciseData(module, level, exercise) {
        var configuration = App.request("configuration:exercise:niveau", module, level, exercise);
        var data = [];
        var dataCount = 10;
        switch (exercise) {
            case "f1":
                {
                    var numChareters = configuration.numChareters;
                    var numNotEqual = 0;
                    var creator = new DataCreator(true);
                    data = creator.generateData(dataCount, numChareters, numNotEqual);
                    insertSpaceseInValues(data);
                }
                break;
            case "f2":
                {
                    var numChareters = configuration.numChareters;
                    var numNotEqual = 50;
                    var creator = new DataCreator(false);
                    data = creator.generateData(dataCount, numChareters, numNotEqual);
                }
                break;
            case "f3":
                {
                    var numChareters = configuration.numChareters;
                    var numOptions = configuration.numOptions;
                    var numNotEqual = 0;
                    var tenQuestionInEach = [];
                    for (var i = 0; i < 10; i++) {
                        var correctAnswer = OrderUniqueString(configuration.numChareters, CANDIDATES);
                        tenQuestionInEach.push({ lable: correctAnswer, value: correctAnswer, items: [] });
                        if (configuration.numChareters == 1) {
                            var generatedAnswers = LetterArrayThatIsNot(correctAnswer, configuration.numOptions - 1);
                            for (var j = 0; j < configuration.numOptions - 1; j++) {
                                tenQuestionInEach[i].items.push({ lable: generatedAnswers[j], value: generatedAnswers[j] });
                            }
                            tenQuestionInEach[i].items.push({ lable: correctAnswer, value: correctAnswer });
                            tenQuestionInEach[i].items = _.shuffle(tenQuestionInEach[i].items);
                        }
                        else {
                            /**
                             * 21789
                             * 61789
                             * 23789
                             * 63789
                             * 24789
                             * 64789
                             * 25789
                             * 65789
                             */
                            ///make this random on length of configuration.numChareters
                            var toRowsToMessUp = [-1, -1];
                            while (toRowsToMessUp[0] == toRowsToMessUp[1]) {
                                toRowsToMessUp[0] = Math.floor(Math.random() * configuration.numChareters);
                                toRowsToMessUp[1] = Math.floor(Math.random() * configuration.numChareters);
                            }
                            ///Because of the way people read we will only ever change the first and the last character, this support the way people read
                            toRowsToMessUp = [0, configuration.numChareters - 1];
                            ///generatedAnswersForFirstRowANdLastCharacterForSecondRow = "6345" as structure example above
                            var generatedAnswersForSecondRowAndFirstRow = LetterArrayThatIsNot(correctAnswer, Math.ceil(configuration.numOptions / 2));
                            for (var j = 0; j < configuration.numOptions; j++) {
                                var answer = correctAnswer;
                                //Handling first row mutator
                                if (j >= 2) {
                                    answer = ReplaceAt(answer, toRowsToMessUp[0], generatedAnswersForSecondRowAndFirstRow[Math.floor(j / 2)]);
                                }
                                if (j % 2 == 1) {
                                    answer = ReplaceAt(answer, toRowsToMessUp[1], generatedAnswersForSecondRowAndFirstRow[0]);
                                }
                                tenQuestionInEach[i].items.push({ lable: answer, value: answer });
                            }
                            tenQuestionInEach[i].items = _.shuffle(tenQuestionInEach[i].items);
                        }
                    }
                    return tenQuestionInEach;
                    //FIXME: Dead code put in comment
                    ///old bug-exploaidable code starts here
                    // let creator = new DataCreator();
                    // let wordCreator = new WordCreator();
                    // wordCreator.chareters = "bcdefgijklmoprtuvxz";
                    // let parents = creator.generateData(dataCount, numChareters);
                    // _.each(parents, function (parent) {
                    //     parent.items = creator.generateData(numOptions, numChareters, numNotEqual);
                    //     // there may only be one correct.
                    //     let wrongCount = numOptions - 1;
                    //     // Create some items that is equal to the parent
                    //     _.each(parent.items, function (item, i) {
                    //         if (i + 1 > wrongCount) {
                    //             item.value = parent.value;
                    //             item.lable = parent.lable;
                    //         } else {
                    //             let value = wordCreator.createWordNotEqualTo(parent.value, numChareters);
                    //             item.value = value;
                    //             item.lable = value;
                    //         }
                    //     });
                    //     // And shuffle the items in to random positions.
                    //     parent.items = _.shuffle(parent.items);
                    // });
                    // createExtraItemsWithTheFirstLetterEqualToTheTarget(parents);
                    // data = parents;
                }
                break;
        }
        return data;
    }
    function insertSpaceseInValues(data) {
        //  Split rules
        //   xx
        //   xxx
        //   xxx
        //   xx xx
        //   xxxx
        //   xxxx
        //   xx xxx
        //   xx xxx
        //   xxx xxx
        _.each(data, function (obj) {
            var numberLabel = obj.lable.split("");
            switch (numberLabel.length) {
                case 4:
                    numberLabel.splice(2, 0, "&nbsp;");
                    break;
                case 5:
                    numberLabel.splice(2, 0, "&nbsp;");
                    break;
                case 6:
                    numberLabel.splice(3, 0, "&nbsp;");
                    break;
                default:
                    break;
            }
            obj.lable = numberLabel.join("");
        });
    }
    function configureExersice(id, options) {
        _.extend(Entities.StaticData.exerciseConfiguration[id], options);
    }
    function getConfiguration(id) {
        return _.clone(Entities.StaticData.exerciseConfiguration[id]);
    }
    // "m1", "1", "f1"
    function getNiveauSettings(moduleID, levelID, exerciseID) {
        var data = Entities.StaticData.modulesSettings;
        var exerciseSettings = {};
        _.each(data, function (module) {
            if (module.moduleID == moduleID) {
                _.each(module.levels, function (level) {
                    if (level.level == levelID) {
                        _.each(level.exercises, function (exercise) {
                            if (exercise.exerciseID == exerciseID) {
                                exerciseSettings = exercise.settings;
                            }
                        });
                    }
                });
            }
        });
        return exerciseSettings;
    }
    function createExtraItemsWithTheFirstLetterEqualToTheTarget(data) {
        _.each(data, function (obj) {
            if (obj.lable.length > 1) {
                var firstLetterOfParent = obj.lable[0];
                var lableOfParent = obj.lable;
                var valueOfParent = obj.value;
                var matchingElement = _.where(obj.items, {
                    lable: lableOfParent,
                    value: valueOfParent
                })[0];
                console.log(lableOfParent, valueOfParent);
                var indexOfElementThatShouldBeIgnored = obj.items.indexOf(matchingElement);
                var indexOfTarget = randomNumberWithoutValue(0, obj.items.length - 1, indexOfElementThatShouldBeIgnored);
                var item = obj.items[indexOfTarget];
                item.lable = replaceFirstLetterInString(item.lable, firstLetterOfParent);
                item.value = replaceFirstLetterInString(item.value, firstLetterOfParent);
                // Prevent the new word (with the same start letter as the correct response)
                // from beeing equal to the correct response.
                while (item.lable == lableOfParent && item.value == valueOfParent) {
                    var lableCopy = item.lable;
                    var lableWithoutFirstLetter = item.lable.substring(1);
                    var wordCreator = new WordCreator();
                    var newWordEnding = wordCreator.createWordNotEqualTo(lableWithoutFirstLetter, lableWithoutFirstLetter.length);
                    var newWord = lableCopy.substring(0, 1) + newWordEnding;
                    item.lable = item.value = newWord;
                }
            }
        });
    }
    function randomNumberWithoutValue(min, max, without) {
        var index = _.random(min, max);
        while (index == without)
            index = _.random(min, max);
        return index;
    }
    function replaceFirstLetterInString(string, replacement) {
        var arr = string.split("");
        arr[0] = replacement;
        return arr.join("");
    }
});
//# sourceMappingURL=exercises.entities.js.map;
 /***************************/ 
App.module("Entities", function (LOCAL_MODULE_NAME, App, _Backbone, Marionette, $, _) {
    App.commands.setHandler("entities:f2-list-data", function (callBack) {
        // switch på App.currentLevel
        var wordLength = 0;
        switch (App.currentLevel) {
            case 3:
                wordLength = 8;
                break;
            case 6:
                wordLength = 11;
                break;
            case 9:
                wordLength = 14;
                break;
        }
        if (wordLength != App.currentLevel + 5) {
            console.error("Unexpected wordLength for level " + App.currentLevel + ": " + wordLength);
        }
        var textLanguage;
        //code because old text packages was named outside system
        switch (App.userdata.dataset) {
            case "eud":
            case "frontread":
            case "mellemtrin": //does not exist anymore; is now "dan_prins_arthur"
            case "skole5_6":
            case "skole7_10":
                textLanguage = "dan";
                break;
            default:
                textLanguage = App.userdata.dataset.substring(0, 3);
                break;
        }
        console.log("textLanguage " + textLanguage);
        var url = "assets/json/{0}/word-{1}.json".format(textLanguage, wordLength);
        $.getJSON(url + "?cb=" + (+new Date())).done(function (data) {
            callBack(getF2dataSet(data));
        }).fail(function (e) {
            console.error(e);
        });
    });
    function getF2dataSet(data) {
        console.log('randomizing dataset');
        var array = data.words;
        var length = array.length;
        var count = 20;
        var indexes = createRandomAndUniqArrayIndexes(count, length);
        var picks = selectIndexesFromArray(indexes, array);
        return picks;
    }
    function createRandomAndUniqArrayIndexes(count, length) {
        var picks = [];
        for (var i = 0; i < count; i++) {
            var index = zoo.random.intInRange(0, length);
            while (picks.indexOf(index) > -1) {
                index = zoo.random.intInRange(0, length);
            }
            picks.push(index);
        }
        return picks;
    }
    function selectIndexesFromArray(arrIndexes, array) {
        var picks = [];
        _.each(arrIndexes, function (index) {
            var value = array[index];
            picks.push({ lable: value, value: value });
        });
        return picks;
    }
});
//# sourceMappingURL=f2data.entities.js.map;
 /***************************/ 
var Server = {
    is_bussy_saving: false,
    queed_data_for_saving: [],
    initialize: function () {
        console.log("Server.wrapper - Server.initialize");
        var self = this;
        var deferred = $.Deferred();
        DataStore.API().initialize().done(function () {
            console.log("server.wrapper DataStore.API().initialize");
            self.loadUserData().done(function () {
                $("body").addClass("language-" + App.request("language"));
                deferred.resolve();
            }).fail(function () {
                deferred.resolve();
            });
        }).fail(function () {
            console.log("authentication failed: server wrapper");
            deferred.resolve();
        });
        return deferred;
    },
    logout: function () {
        console.log("Server.wrapper -logout");
        var deferred = $.Deferred();
        DataStore.API().logout();
        deferred.resolve();
        return deferred;
    },
    authenticate: function (params) {
        var self = this;
        return DataStore.API().authenticate(params).done(function () {
            console.log("Authenticated... ");
            self.loadUserData().done(function (data) {
                console.log("Load data complete");
                Backbone.history.navigate("", true);
            }).fail(function () {
                console.log("load data failed.");
                Backbone.history.navigate("", true);
            });
        }).fail(function (data) {
            console.log("login failed " + JSON.stringify(data)); //only ErrorCode?
        });
    },
    authenticateUser: function (username, password) {
        console.log("Server.wrapper - User Authentication FrontRead");
        var deferred = $.Deferred();
        Authenticator.autenticate_frontread(username, password, function (err, data) {
            if (err) {
                deferred.reject();
            }
            else {
                DataStore.API().authenticated ? deferred.resolve() : deferred.reject();
            }
        });
        return deferred;
    },
    authenticateUserUNIC: function (username, password) {
        console.log("Server.wrapper - User Authentication UNIC");
        var deferred = $.Deferred();
        Authenticator.authenticate_UNI_mobile(username, password, function (err, data) {
            if (err) {
                deferred.reject();
            }
            else {
                DataStore.API().authenticated ? deferred.resolve() : deferred.reject();
            }
        });
        return deferred;
    },
    authenticateUserUNICWeb: function () {
        Authenticator.authenticate_UNI_web();
    },
    loadUserData: function () {
        var deferred = $.Deferred();
        DataStore.API().loadUserData().done(function (data) {
            if (data._saveData) {
                console.log("savedataID reset");
                localStorage.setItem("savedataID", data._saveData);
            }
            App.userdata = data;
            deferred.resolve(data);
            App.vent.trigger("changeInUserData");
            if (data._dataset) {
                console.log("Load user data, dataset found");
            }
            else {
                console.log("Load user data, dataset not found");
            }
        }).fail(function () {
            deferred.reject();
        });
        return deferred;
    },
    saveUserData: function () {
        console.debug("saveUserData Called");
        App.vent.trigger("show:savedialog");
    },
    checkConnection: function () {
        var deferred = $.Deferred();
        deferred.resolve(DataStore.API().isOnline());
        return deferred;
    }
};
//# sourceMappingURL=server.wrapper.js.map;
 /***************************/ 
App.module("Keyboard", function(Keyboard, App, Backbone, Marionette, $, _){

	var NUMERIC = [
		{type: "input",  value: "7", 		event: "value:selected"},
		{type: "input",  value: "8", 		event: "value:selected"},
		{type: "input",  value: "9", 		event: "value:selected"},
		{type: "input",  value: "4", 		event: "value:selected"},
		{type: "input",  value: "5", 		event: "value:selected"},
		{type: "input",  value: "6", 		event: "value:selected"},
		{type: "input",  value: "1", 		event: "value:selected"},
		{type: "input",  value: "2", 		event: "value:selected"},
		{type: "input",  value: "3", 		event: "value:selected"},
		{type: "input",  value: "0", 		event: "value:selected"},
		{type: "clear",  value: "slet", 	event: "clear"}
		//{type: "submit", value: "ok", 		event: "submit"}
	];

	var Controller = {
		create: function (layout) {
			var collection = new Backbone.Collection(layout);
			var view = new Keyboard.View({collection: collection})
			return view;
		}
	};

	App.reqres.setHandler("create:keyboard", function ( layout ) {
		layout = layout === undefined ? NUMERIC : layout;
		return Controller.create(layout);
	});
});;
 /***************************/ 
App.module("Keyboard", function(Keyboard, App, Backbone, Marionette, $, _){

	
	var Key = Marionette.ItemView.extend({
		className: "key",
		template: "keyboard/show/key",

		fastButtonEvents: {
			"click": "onButtonClicked"
		},

		getButtonClass: function (type) {
			if(type !== "input") 	return "dark " + type;
			return type;
		},

		onShow: function () {
			this.$el.addClass(this.getButtonClass(this.model.get("type")));
		},

		onButtonClicked: function () {
			this.trigger(this.model.get("event"), this.model.get("value"));
			this.trigger("click");
		}
	});



	Keyboard.View = Marionette.CollectionView.extend({
		template: "",
		className: "keyboad",
		itemView: Key,

		states: {
			INPUT: 1,
			ACTION: 2,
			DISABLED: 3
		},

		currentState: 1,
		currentValue: "",

		initialize: function () {
			this.listenTo(this, "itemview:value:selected", this.onValueSelected, this);
			this.listenTo(this, "itemview:click", this.onClicked, this);
			this.listenTo(this, "itemview:clear", this.onClear, this);
			this.listenTo(this, "itemview:submit", this.onSubmit, this);
		},

		onClicked: function (itemview) {
			if(itemview.$el.hasClass("submit") && this.currentState !== this.states.DISABLED && ! itemview.$el.hasClass("disabled")){
				 if(this.currentState == this.states.INPUT){
				 	
				 	if(this.hasText())
						itemview.$el.addClass("action-pending")
					

				 }else{
				 	itemview.$el.addClass("action-pending")
				 }
			}
		},

		hasText: function () {
			return this.currentValue.length > 0;
		},

		onValueSelected: function (itemview, eventData) {
			this.currentValue = this.currentValue + eventData;
			this.trigger("value:selected", eventData);
			this.enableSubmitKey();
		},

		onClear: function () {
            this.trigger("clear");
			if(this.currentState == this.states.INPUT)
				this.disableSubmitKey();
		},

		onSubmit: function () {

			if($(".submit").hasClass("disabled")) return;

			if(this.currentState == this.states.INPUT){
				if(this.hasText())
					this.trigger("submit");
			}else{
				this.trigger("submit")
			}
		},

		enableInputKeys: function () {
			$(".input").animate({opacity: 1, duration: .7}).removeClass("disabled");
		},

		enableClearKey: function () {
			$(".clear").animate({opacity: 1, duration: .7}).removeClass("disabled");
		},

		enableSubmitKey: function () {
			this.trigger("enable:true");
			$(".submit").animate({opacity: 1, duration: .7}).removeClass("disabled");
		},

		disableInputKeys: function () {
			$(".input").animate({opacity:  .5, duration: .7}).addClass("disabled");
		},

		disableClearKey: function () {
			$(".clear").animate({opacity:  .5, duration: .7}).addClass("disabled");
		},

		disableSubmitKey: function () {
			this.trigger("enable:false");
			$(".submit").animate({opacity: .5, duration: .7}).addClass("disabled");
		},

		setState: function (state) {
			this.currentState = state;
			$(".submit").removeClass("action-pending");

			if(state == this.states.INPUT) {
				this.$el.find(".submit td")
				//this.$el.find(".submit td").html("<div class='glyphicon glyphicon-pencil' ></div>")
				this.enableInputKeys();
				this.enableClearKey();
				this.disableSubmitKey();

			}else if(state == this.states.ACTION) {
				this.$el.find(".submit td")
				//this.$el.find(".submit td").html("<div class='glyphicon glyphicon-eye-open'></div>")
				this.disableInputKeys();
				this.disableClearKey();
				this.enableSubmitKey();

			}else if(state == this.states.DISABLED) {
				
				this.disableInputKeys();
				this.disableClearKey();
				this.disableSubmitKey();
			}
		}
	});

});;
 /***************************/ 
App.module("Keyboard.Touch", function(Keyboard, App, Backbone, Marionette, $, _){

	Keyboard.View = Marionette.ItemView.extend({
		template: "keyboard/show/keyboard.touch",
		hammer: null,
		keyChordinates: [],
		numInputs: 0,
		lastNumInputs: 0,
		content: "",
		states: {
			INPUT: 1,
			ACTION: 2,
			DISABLED: 3
		},
		EVENTS: {
			VALUE_SELECTED: "value:selected",
			CLEAR: "clear",
			SUBMIT: "submit",
			ENABLED_TRUE: "enabled:true",
			ENABLED_FALSE: "enabled:false"
		},
		fastButtonEvents: {
			"click .clear": "onClearClicked",
			"click .n0": "onZero",
			"click .n1": "onOne",
			"click .n2": "onTwo",
			"click .n3": "onThree",
			"click .n4": "onFour",
			"click .n5": "onFive",
			"click .n6": "onSix",
			"click .n7": "onSeven",
			"click .n8": "onEight",
			"click .n9": "onNine"

		},
		ui: {
			keyboard: ".keyboard",
		},
		// ------------------------------------------------------------
		// interface.keuboard
		setState: function (state) {
			this.hammer.off("hammer.input", this.onTouchInput);
			if(state == this.states.INPUT) {
				this.hammer.on("hammer.input", this.onTouchInput.bind(this));
				$(".key").removeClass("disabled")
			}else {

				$(".key").addClass("disabled");
			}
		},
		onSubmit: function () {
			if($(".submit").hasClass("disabled")) return;

			if(this.currentState == this.states.INPUT){
				if(this.hasText())
					this.trigger("submit");
			}else{
				this.trigger("submit")
			}
		},
		hasText: function () {
			return this.content.length() > 0
		},
		// ------------------------------------------------------------
		onShow: function () {
			this.keyChordinates = [];
			this.createKeyChordinates();
			this.initializeHammer();
			
		},
		initializeHammer: function() {
			this.hammer = new Hammer($(".keyboard").get(0));
			this.hammer.on("hammer.input", this.onTouchInput.bind(this));
			//this.hammer.on("tap", this.onTest.bind(this))
		},	
		onClose: function () {
			//this.hammer.off("tap", this.onTest);
			this.hammer.off("hammer.input", this.onTouchInput);
			this.hammer.destroy();
			
		},
		onTest: function ( ) {
			this.trigger(this.EVENTS.VALUE_SELECTED, "1");
		},

		createKeyChordinates: function () {

			var self = this;
			this.ui.keyboard.find(".key").each(function () {
			    var $el = $(this);
			    self.keyChordinates.push({
			        x: $el.position().left,
			        y: $el.position().top,
			        width: $el.width(),
			        height: $el.height(),
			        selected: false,	
			        $el: $el,
			        value: $el.find(".innerwrapper").text()
			    });
			})
		},
		onTouchInput: function(e) {

			
			e.preventDefault();

			// mouse up
			if (e.isFinal) {

				this.numInputs = 0;
				this.lastNumInputs = -1;

			// mouse down.
			} else {

				this.numInputs = e.pointers.length;
				this.setSelectedItem(e);
				
				if(this.numInputs > this.lastNumInputs) {
					this.outputInputs();
				}

				this.lastNumInputs = this.numInputs;
			}
		},

		setSelectedItem:  function(e) {

			for (var i = 0; i < this.keyChordinates.length; i++) 
				this.keyChordinates[i].selected = false;
			
			var touch = e.pointers[this.numInputs-1]; //e.pointers.pop();

			var touchPoint = {
				x: (touch.clientX - this.getOffset().left), 
				y: (touch.clientY - this.getOffset().top), 
				height: 1, 
				width:  1
			};

			for (var j = 0; j < this.keyChordinates.length; j++) { 
				if(hittest(touchPoint, this.keyChordinates[j])) {
					this.keyChordinates[j].selected = true;
				}
			}
		},
		outputInputs: function () {
			for (var i = 0; i < this.keyChordinates.length; i++) {

				if(this.keyChordinates[i].selected) {
					this.animateKey(this.keyChordinates[i].$el);
					//this.content += this.keyChordinates[i].value;
					
					this.trigger(this.EVENTS.VALUE_SELECTED, this.keyChordinates[i].value);
					this.keyChordinates[i].selected = false;
				}
			}

			
			
		},
		animateKey: function($el)  {
			TweenMax.to($el, 0, {backgroundColor: "#222", color: "#ffffff"});
			TweenMax.to($el, 0.2, {backgroundColor: "#ffffff", color: "#333333", delay: 0.2});
		},
		getOffset: function () {
			return $(".keyboard").offset();
		},
		onClearClicked: function ()
		{
            this.trigger(this.EVENTS.CLEAR);
		},

		onZero: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "0");
			}
		},
		onOne: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "1");
			}
		},
		onTwo: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "2");
			}
		},
		onThree: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "3");
			}
		},
		onFour: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "4");
			}
		},
		onFive: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "5");
			}
		},
		onSix: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "6");
			}
		},
		onSeven: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "7");
			}
		},
		onEight: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "8");
			}
		},
		onNine: function () {
			if(!config.mobile_app) {
				this.trigger(this.EVENTS.VALUE_SELECTED, "9");
			}
		}
	});

	// Helpers -----------------------------------------------

	function createRect (obj)
	{
		if(config.mobile_app)
		{
			return {
				top: obj.y,
				left: obj.x,
				right: obj.x + obj.width,
				bottom: obj.y + obj.height
			}
		}
	}

	function hittest (a, b) {
		if(config.mobile_app)
		{
			var rect1 = createRect(a);
			var rect2 = createRect(b);
			return (
	    		((rect2.top <= rect1.top) 	 && (rect1.top <= rect2.bottom)) 	&&
	    		((rect2.top <= rect1.bottom) && (rect1.bottom <= rect2.bottom)) &&
	    		((rect2.left <= rect1.left)  && (rect1.left <= rect2.right)) 	&&
	    		((rect2.left <= rect1.right) && (rect1.right <= rect2.right))
	    	)
		}
	}

	// -------------------------------------------------------



	App.reqres.setHandler("create:keyboard:touch", function () {
		return new Keyboard.View();
	})

/*
	App.addInitializer(function () {

		$(App.utilPopupRegion.el).show();
		App.utilPopupRegion.show(new Keyboard.View())
		console.warn("keyboard.touch")
	})
*/
});;
 /***************************/ 
App.module("Taskviews.BlinkView", function(BlinkView, App, Backbone, Marionette, $, _){


	var TextItem = Marionette.ItemView.extend({

		className: "blink-selectable-element",
		template: "taskviews/blinkview/show/text.item"
	});
	


	BlinkView.View = Marionette.ItemView.extend({
		template: "taskviews/blinkview/show/blinkview",
		className: "blink-view",
		itemViewContainer: "td",

		templateHelpers: {
			hasImage: function () {
				return this.hasOwnProperty("image");
			}
		},

		initialize: function () {
			this.delay 			= this.model.get("delay") 		 || 1000;
			this.shutterspeed 	= this.model.get("shutterspeed") || 250;

			if(!this.model.attributes.hasOwnProperty("lable"))
				this.model.attributes.lable = this.model.attributes.value;

		},

		onShow: function () {
			this.el = this.$el.find(".lable").get(0);		
			this.hideContent();			
		},

		setColor: function (color) {
			this.el.style.color = color;
		},

		hideContent: function () {
			this.setColor("#ffffff");
		},
		showContent: function () {
			this.setColor("#000000");
		},

		start: function () {
			this.$el.addClass("blink-action-pending");
			timeout(this.onAfterDelay.bind(this), this.delay);
		},

		onAfterDelay: function (time) {
			this.showContent();
			timeout(this.blink.bind(this), this.shutterspeed);
		},

		blink: function (time) {
			this.hideContent();
			console.log("blink:", time);
			setTimeout(this.onComplete.bind(this), 200);
			timeout(this.onComplete.bind(this), 200);
		},

		onComplete: function () {
			this.trigger("complete");
		}
	});

	BlinkView.ViewF3 = BlinkView.View.extend({
		onShow: function () {
			console.log("wrapping letters")
			//	wrap the content in the letter-(letter) class to normalize animal sizes.
			this.el = this.$el.find(".lable").get(0);
			var letters = $(this.el).text().trim();
			var html = [];
			_.each(letters, function(letter) {
				html.push("<span class='letter-{0}'>{0}</span>".format(letter));
			});
			$(this.el).empty().html(html.join(""));
			this.hideContent();		
		}
	});
});;
 /***************************/ 
App.module("Taskviews.Countdownview", function(Countdownview, App, Backbone, Marionette, $, _){
    Countdownview.View = Marionette.ItemView.extend({

        template: "taskviews/couontdownview/show/countdownview.show",

        createIntroAnimation: function(nthChild, time, ease) {
            return TweenMax.fromTo(".text-count-down .text:nth-child(" + nthChild + ")",   time, {scale: 0}, {scale: 1, display: "block",  ease: ease});
        },

        createOutroAnimation: function(nthChild, time, ease, delay) {
            return TweenMax.to(".text-count-down .text:nth-child(" + nthChild + ")", 	  time, {delay: delay, scale: 0, display: "none",  ease: ease});
        },

        start: function () {

            var easeIn = Back.easeOut;
            var easeOut = Power1.easeInOut;
            var timeIn = 0.2;
            var timeOut = 0.3;
            var delay = 0.4;

            var tl = new TimelineMax({repeat:0, yoyo:false, repeatDelay:1, onComplete: this.onCountDownComplete.bind(this) });
            tl.add(this.createIntroAnimation(1, timeIn, easeIn));
            tl.add(this.createOutroAnimation(1, timeOut, easeOut, delay));
            tl.add(this.createIntroAnimation(2, timeIn, easeIn));
            tl.add(this.createOutroAnimation(2, timeOut, easeOut, delay));
            tl.add(this.createIntroAnimation(3, timeIn, easeIn));
            tl.add(this.createOutroAnimation(3, timeOut, easeOut, delay));
        },
        onCountDownComplete: function () {
            this.trigger("countdown:complete");
        }
    })
});
;
 /***************************/ 
App.module("Taskviews.Progressbarview", function(Progressbarview, App, Backbone, Marionette, $, _){

    Progressbarview.View = Marionette.ItemView.extend({

		template: "taskviews/progressbarview/show/progressbarview.show",

        createOutroAnimation: function(time, ease, delay) {
            return TweenMax.to(".text-count-down .progress-center", time, {delay: delay, scale: 0, display: "none",  ease: ease});
        },

		start: function () {
			var easeOut = Power1.easeInOut;
            var timeOut = 2;
			var delay = 0.4;


            var parent = new TimelineMax({repeat:0, yoyo:false, repeatDelay:1, onComplete: this.onCountDownComplete.bind(this)});

            function makeTl(num) {
                var tl = new TimelineMax({repeat:1, yoyo:false});
                tl.to("#box1", 1, {top:num})
                    .to("#box2", 1, {top:num}, "-=0.5")
                    .to("#box3", 1, {top:num}, "-=0.5");
                return tl;
            }

            parent.add(makeTl(100))
                .add(makeTl(150))
                .add(makeTl(200))
                .from(".red-bar", parent.duration(), {width:0, ease:Linear.easeNone}, 0).timeScale(3);
            parent.add(this.createOutroAnimation(timeOut, easeOut, delay));
		},
		onCountDownComplete: function () {
			this.trigger("countdown:complete");
		}
	})

});;
 /***************************/ 
App.module("Taskviews.Quiz", function(Quiz, App, Backbone, Marionette, $, _){
	
	var readonly = true;

	var ResponseView = Marionette.ItemView.extend({
		template: "",

		initialize: function() {
			this.setTemplate()
		},
		setTemplate: function() {
			this.template = readonly
				? "taskviews/quizview/show/quiz.response.readonly"
				: "taskviews/quizview/show/quiz.response";
		}
	});

	var ObjectiveView = Marionette.CompositeView.extend({
		template: "",
		itemView: ResponseView,
		itemViewContainer: ".responseContainer",

		initialize: function() {
			
			var groupID = this.model.get("id");
			this.collection = new Backbone.Collection(this.model.get("responses"));
			this.collection.each(function(model, i) {
				model.set("groupID", groupID);
				model.set("id", i+1);
			});
			this.setTemplate();
		},

		setTemplate: function () {
			this.template = readonly 
				? "taskviews/quizview/show/quiz.objective.readonly"
				: "taskviews/quizview/show/quiz.objective";
		}
	});

	Quiz.View = Marionette.CompositeView.extend({
		itemView: ObjectiveView,
		template: "taskviews/quizview/show/quiz.show",
		itemViewContainer: ".quizQuestions",
		events: {
			"click .btnSubmit": "getSelectedItems",
			"change input[type=radio]": "onInputSelected"
		},
		///Selection the correct answers ui
		initialize: function (options) {

			readonly = options.readonly;
			this.readonly = readonly;
			
			this.collection = new Backbone.Collection(this.model.get("objectives"));
			this.collection.each(function(model, i) {
				model.set("id", i+1)
			})
		},

		onShow: function() {
			if(this.readonly) $(".btnSubmit").removeClass("disabled");

			var image = this.model.get("image");
			if(image && image !== "") {
				this.$el.find(".quizQuestions")
					.prepend($("<img>").attr("src", image).css("paddingBottom", 20))

			}
		},

		isAllInputsSelected: function () {

			console.log("Chosen answers: ", $("input[type=radio]:checked").length, " of ", this.model.get("correctResponses").length);
			if(!this.readonly)
				return $("input[type=radio]:checked").length == this.model.get("correctResponses").length;
			else 
				return true;
		},

		onInputSelected: function () {
			if(this.isAllInputsSelected()) {
				$(".btnSubmit").removeClass("disabled")
			}
		},

		getSelectedItems: function () {
			var userResponses = ""
			$("input[type=radio]:checked").each(function(){
			    var $el = $(this);
			    var value = $el.val().toString();
			    userResponses += value;
			})
			var result = Quiz.Validation.validate(this.model.get("correctResponses"), userResponses);
			this.createResultData(result, userResponses, this.model.get("correctResponses"));
			this.trigger("quiz:submit", result)
		},

		createResultData: function (validatedResponses, userResponses, correctResponses) {

			if(this.readonly) return;
			
			console.log( 'CREATING RESULT DATA WITH CORRECT RESPONSES MARKED' );
			var resultData = [];
		    var arrObjectives = this.model.get("objectives");
		    

		    _.each(arrObjectives, function(objective, nObjective){
		        
		        
		        var currentUserResponse = parseInt(userResponses[nObjective]);
		        
		        var objObjective = {};
		        objObjective.text = objective.text;
		        objObjective.responses = [];
		        resultData.push(objObjective)
		        
		        _.each(objective.responses, function(response, i){
		            
		            var result = "";
		            var isTheCorrectResponse = false;
		            
		            // This is the user response
		            if(i+1 == currentUserResponse) 
		                result = validatedResponses[nObjective] ? "correct" : "wrong"

		            if(i+1 == correctResponses[nObjective])
		            	isTheCorrectResponse = true;
		            
		            
		            var objResponse = {};
		            objResponse.text = response.text;
		            objResponse.state = result;
		            objResponse.isTheCorrectResponse = isTheCorrectResponse;
		            objObjective.responses.push(objResponse)
		        })
		    })
		    
		    App.execute("save:userResponses", resultData);
		}
	});


	Quiz.Validation = {

		isCorrect: function (objective, response) {
			return objective == response;
		},

		getResponses: function (responses) {
			return responses.split("");
		},

		getObjectives: function (correctResponses) {
			return correctResponses.split("");
		},

		validate: function (correctResponses, responses) {

			var a = this.getObjectives(correctResponses);
			var b = this.getResponses(responses);
			var result = [];

			_.each(a, function(value, i){
				result.push(value == b[i]);
			});

			return result;
		}
	};

});;
 /***************************/ 
App.module("Taskviews.TextinputView", function(TextinputView, App, Backbone, Marionette, $, _){


	TextinputView.View = Marionette.Layout.extend({

				  
		template: "taskviews/textinputview/show/textinputview",
		className: "textinput-view",

		regions: {
			textRegion: ".lbltext",
		},

		modelEvents: {
			"change:value": "createChareters"
		},


		initialize: function () {
			this.createInitialData();
			this.id = +new Date();
		},

		createInitialData: function () {
			var data = [];

			for(var i = 0; i < this.model.get("numChareters"); i ++) {
				data.push({lable: "-"});
			}

			this.initialData = data;
			this.charetersCollection = new Backbone.Collection(data);
		},

		onShow: function () {
			//console.log("new textinput show")
			this.textRegion.show(new Chareters({collection: this.charetersCollection}));
		},
		onClose: function () {
			this.stopListening();
		},
		destroy: function(args) {
			this.stopListening();
		},

		addController: function (keyboard) {
			this.listenTo(keyboard, "value:selected", this.onValueSelected);
			this.listenTo(keyboard, "clear", this.clear);
		},

		createChareters: function () {

			var numChareters = this.model.get("numChareters");
			var chareters 	 = this.model.get("value").split("");
			var data = [];


			for(var i = 0; i<numChareters; i ++) {
				data.push({lable: "-"});
			}

			for(var j = 0; j < chareters.length; j++) {
				data[j].lable = chareters[j];
			}

			this.charetersCollection.reset(data);

		},

		onValueSelected: function (eventData) {

			var self = this;
			var newValue = this.model.get("value") + eventData;

			//console.log("[" + this.id + "], ", newValue.length, this.model.get("numChareters"))

			if(newValue.length > this.model.get("numChareters")) return;
				this.model.set("value", newValue);

			if(this.model.get("value").length == this.model.get("numChareters")){

				setTimeout(function () {
					
					self.textRegion.reset();
					self.charetersCollection.reset(self.initialData)
					self.trigger("complete");

					self.model.attributes.value =  "";
				}, 300);
			}
		},

		clear: function () {
			var newValue = this.model.get("value");
            newValue = newValue.substring(0, newValue.length -1);
            this.model.set({value: newValue});
		}
	});


	var Chareter = Marionette.ItemView.extend({
		tagName: "span",
		template: "taskviews/textinputview/show/textinputview.chareter",
		className: "chareterOutline"
	});

	var Chareters = Marionette.CollectionView.extend({
		itemView: Chareter,

		onShow: function () {
		}
	});

});;
 /***************************/ 
var ContinousBlinkCommand = commands.Command.extend({
    initialize: function (options) {
        this.model = options.model;
        this.view = this.createBlinkView();
        this.region = options.region;
        this.waitForUserInput = options.waitForUserInput;
    },
    createBlinkView: function (data) {
        console.log("createBlinkView", this.model.get("blinkSpeed"));
        var blinkModelData = {
            delay: 500,
            shutterspeed: parseInt(this.model.get("blinkSpeed")),
            value: this.model.get("value")
        };
        return App.request("create:blinkview", blinkModelData);
    },
    execute: function () {
        this.listenTo(this.view, "complete", this.onComplete, this);
        $(".btnStart").bind("click", this.start.bind(this));
        this.region.show(this.view);
        if (!this.waitForUserInput)
            this.view.start();
    },
    start: function () {
        this.view.start();
    },
    onComplete: function () {
        $(".btnStart").unbind();
        this.stopListening();
        delete this.view;
        delete this.region;
        this.complete();
    }
});
var BlinkCommandBase = commands.Command.extend({
    initialize: function (options) {
        this.model = options.model;
        this.view = this.createBlinkView(options.data);
        this.region = options.region;
        this.keyboard = options.keyboard;
        this.messageBox = options.messageBox;
    },
    createBlinkView: function (data) {
        var blinkModelData = {
            delay: 1000,
            shutterspeed: +this.model.get("blinkSpeed")
        };
        _.extend(blinkModelData, data);
        var BlinkView = this.requestBlinkView(blinkModelData);
        return BlinkView;
    },
    execute: function () {
        this.listenTo(this.keyboard, "submit", this.onSubmit, this);
        this.listenTo(this.view, "complete", this.onComplete, this);
        this.region.show(this.view);
        this.keyboard.setState(this.keyboard.states.ACTION);
    },
    onSubmit: function () {
        this.view.start();
    },
    onComplete: function () {
        this.stopListening();
        delete this.view;
        delete this.region;
        delete this.keyboard;
        delete this.messageBox;
        this.complete();
    }
});
var BlinkCommand = BlinkCommandBase.extend({
    requestBlinkView: function (model) {
        return App.request("create:blinkview", model);
    }
});
var BlinkCommandF3 = BlinkCommandBase.extend({
    requestBlinkView: function (model) {
        //console.log("BlinkCommandF3 - requested")
        return App.request("create:blinkview-f3", model);
    }
});
var BlinkCommandNoWaitForUserInput = BlinkCommand.extend({
    execute: function () {
        this.listenTo(this.view, "complete", this.onComplete, this);
        this.region.show(this.view);
        this.keyboard.setState(this.keyboard.states.ACTION);
        this.view.start();
    },
    onComplete: function () {
        this.stopListening();
        delete this.view;
        delete this.region;
        delete this.keyboard;
        delete this.messageBox;
        this.complete();
    }
});
var BlinkCommandNoWaitForUserInputAndNoKeyboard = BlinkCommandF3.extend({
    execute: function () {
        this.listenTo(this.view, "complete", this.onComplete, this);
        this.region.show(this.view);
        this.view.start();
    },
    onComplete: function () {
        this.stopListening();
        delete this.view;
        delete this.region;
        delete this.keyboard;
        delete this.messageBox;
        this.complete();
    }
});
var TextInputCommand = commands.Command.extend({
    initialize: function (options) {
        this.reqres = options.reqres;
        this.vent = options.vent;
        this.view = this.createTextInputView(options.keyboard, options.numChareters);
        this.region = options.region;
        this.keyboard = options.keyboard;
        this.messageBox = options.messageBox;
    },
    createTextInputView: function (keyboard, numChareters) {
        var textinput = App.request("create:textinput", numChareters);
        textinput.addController(keyboard);
        return textinput;
    },
    execute: function () {
        this.keyboard.currentValue = "";
        this.listenTo(this.keyboard, "enable:true", this.onHasTextTrue, this);
        this.listenTo(this.keyboard, "enable:false", this.onHasTextFalse, this);
        this.listenTo(this.keyboard, "submit", this.onComplete, this);
        this.listenTo(this.view, "complete", this.onComplete, this);
        this.view.clear();
        this.region.show(this.view);
        this.keyboard.setState(this.keyboard.states.INPUT);
    },
    onHasTextTrue: function () {
    },
    onHasTextFalse: function () {
    },
    destroy: function () {
        this.view.clear();
        this.stopListening();
        this.view.destroy();
    },
    onComplete: function () {
        var that = this;
        this.keyboard.setState(this.keyboard.states.DISABLED);
        var isCorrect = this.reqres.request("exercise:save-response", this.view.model.get("value"));
        new FeedbackBox().show(isCorrect);
        this.vent.trigger("exercise:progress:updated");
        this.destroy();
        setTimeout(function () { that.complete(); }, 1500);
    }
});
var TouchInputCommand = commands.Command.extend({
    initialize: function (options) {
        this.model = options.model;
        this.reqres = options.reqres;
        this.vent = options.vent;
        this.view = this.createTouchInputView(options.data);
        this.region = options.region;
        this.keyboard = options.keyboard;
        this.responseSaver = options.responseSaver;
        this.updateProgress = options.updateProgress;
        this.messageBox = options.messageBox;
    },
    createTouchInputView: function (data) {
        var touchInput = App.request("create:touchinput", data.items);
        return touchInput;
    },
    execute: function () {
        this.listenTo(this.keyboard, "submit", this.onComplete, this);
        this.listenTo(this.view, "changed", this.checkInput, this);
        this.region.show(this.view);
        this.keyboard.setState(this.keyboard.states.SUBMIT);
        this.keyboard.disableSubmitKey();
    },
    checkInput: function () {
        var self = this;
        setTimeout(function () {
            self.onComplete();
        }, 300);
    },
    destroy: function () {
        this.view.collection.reset();
        this.stopListening();
        delete this.view;
        delete this.region;
        delete this.keyboard;
        delete this.messageBox;
        delete this.responseSaver;
        delete this.updateProgress;
    },
    onComplete: function () {
        var that = this;
        var isCorrect = this.reqres.request("exercise:save-response", this.view.value());
        new FeedbackBox().show(isCorrect, 100);
        this.vent.trigger("exercise:progress:updated");
        this.destroy();
        setTimeout(function () { that.complete(); }, 1500);
    }
});
var QuizCommand = commands.Command.extend({
    initialize: function (options) {
        this.region = options.region;
        this.model = options.model.clone();
        this.readonly = options.readonly;
        this.vent = options.vent;
    },
    execute: function () {
        var view = new App.Taskviews.Quiz.View({ model: this.model, readonly: this.readonly });
        this.listenTo(view, "quiz:submit", this.onComplete, this);
        this.region.show(view);
    },
    onComplete: function (result) {
        if (!this.readonly)
            this.vent.trigger("quiz:submit", result);
        this.complete();
    }
});
//# sourceMappingURL=task.commands.js.map;
 /***************************/ 
App.module("Taskviews", function (Taskviews, App, _Backbone, Marionette, $, _) {
    Taskviews.View = Marionette.Layout.extend({
        template: "components/taskviews/basetaskview",
        className: "blink-view",
        regions: {
            taskcontentRegion: ".taskcontentRegion"
        }
    });
    App.reqres.setHandler("create:blinkview", function (modelData, collection) {
        var model = new _Backbone.Model(modelData);
        var col = collection;
        return new Taskviews.BlinkView.View({
            model: model,
            collection: col
        });
    });
    App.reqres.setHandler("create:blinkview-f3", function (modelData, collection) {
        var model = new _Backbone.Model(modelData);
        var col = collection;
        return new Taskviews.BlinkView.ViewF3({
            model: model,
            collection: col
        });
    });
    App.reqres.setHandler("create:textinput", function (numChareters) {
        return new Taskviews.TextinputView.View({ model: new _Backbone.Model({ value: "", numChareters: numChareters }) });
    });
    App.reqres.setHandler("create:touchinput", function (data) {
        var collection = new _Backbone.Collection(data);
        return new Taskviews.TouchInputView.View({ collection: collection });
    });
});
//# sourceMappingURL=taskviews.js.map;
 /***************************/ 
App.module("Taskviews.TouchInputView", function (TouchInputView, App, _Backbone, Marionette, $, _) {
    var ElementView = Marionette.MenuItemView.extend({
        template: "taskviews/touchinputview/show/touchinputview.element.show",
        templateHelpers: {
            hasImage: function () {
                return this.hasOwnProperty("image");
            },
            getWrappedContent: function () {
                var letters = this.value.split("");
                var html = [];
                _.each(letters, function (letter) {
                    html.push("<span class='letter-{0}'>{0}</span>".format(letter));
                });
                return html.join("");
            }
        },
        className: "touchinput-view-selectable-element",
        tagName: "span",
        events: {
            "click": function () {
            }
        },
        fastButtonEvents: {
            "click": "onElementClicked"
        },
        onSelected: function () {
            this.$el.addClass("selected");
        },
        onDeSelected: function () {
            this.$el.removeClass("selected");
        }
    });
    TouchInputView.View = Marionette.MenuView.extend({
        template: "taskviews/touchinputview/show/touchinputview.show",
        itemView: ElementView,
        itemViewContainer: ".touchinput-item-container",
    });
});
//# sourceMappingURL=touchinputview.show.js.map;
 /***************************/ 
App.module("Accessibility", function (Accessibility, App, _Backbone, Marionette, $, _) {
    var MobileAccessibilityProxy = {
        isScreenReaderRunning: function (callback) {
            return window.hasOwnProperty("MobileAccessibility")
                ? MobileAccessibility["isScreenReaderRunning"](callback)
                : callback(config.accessibility_test_default_return_value);
        },
        isVoiceOverRunning: function (callback) {
            return window.hasOwnProperty("MobileAccessibility")
                ? MobileAccessibility["isVoiceOverRunning"](callback)
                : callback(config.accessibility_test_default_return_value);
        },
    };
    var CheckStatusCommand = commands.Command.extend({
        initialize: function (options) {
            this.type = options.type;
        },
        execute: function () {
            MobileAccessibilityProxy[this.type](this.onStatusCallBack.bind(this));
        },
        onStatusCallBack: function (status) {
            App[this.type] = status;
            this.complete();
        }
    });
    function checkAccibility() {
        console.log("checkAccibility");
        var checkStatus = new commands.SerialCommand();
        checkStatus.addCommand(new CheckStatusCommand({ type: "isScreenReaderRunning" }));
        checkStatus.addCommand(new CheckStatusCommand({ type: "isVoiceOverRunning" }));
        checkStatus.on("command:complete", function () {
            if (App.request("accessibility:isAccessibilityRunning")) {
                App.commands.execute("accessibility:enable");
            }
        });
        checkStatus.execute();
    }
    App.commands.setHandler("accessibility:check", function () {
        setInterval(checkAccibility, 5000);
        checkAccibility();
    });
    App.commands.setHandler("accessibility:enable", function () {
        $("body").addClass("accessibility-true");
    });
    App.commands.setHandler("accessibility:disable", function () {
        $("body").removeClass("accessibility-true");
    });
    App.reqres.setHandler("accessibility:isAccessibilityRunning", function () {
        return App.isScreenReaderRunning || App.isVoiceOverRunning;
    });
});
//# sourceMappingURL=assessibility.commands.js.map;
 /***************************/ 
App.module("Banner", function (Banner, App, _Backbone, Marionette, $, _) {
    Banner.Controller = {
        create: function () {
            return new Banner.View();
        }
    };
    Banner.Init = function () {
        App.menuRegion.show(Banner.Controller.create());
    };
    App.addInitializer(function () {
        //App.menuRegion.show(Banner.Controller.create());
    });
});
//# sourceMappingURL=banner.js.map;
 /***************************/ 
App.module("Banner", function (Banner, App, _Backbone, Marionette, $, _) {
    var TokenRenewer = function (callback) {
        var username = localStorage.getItem("username");
        var userid = localStorage.getItem("userid");
        $.ajax({
            url: App.ServerUrl() + "/tokenrefresh",
            type: 'POST',
            cache: true,
            dataType: 'json',
            headers: {
                Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
            },
            data: {
                username: username,
                userid: userid
            }
        }).done(function (data) {
            console.log("done TokenRenewer");
            callback(null, data);
        }).fail(function () {
            console.error("fail TokenRenewer");
            callback(true);
        });
    };
    var Administration = function () {
        if (localStorage.getItem("rights") == "admin") {
            return App.translate("administration");
        }
        else {
            return App.translate("overview");
        }
    };
    Banner.View = Marionette.ItemView.extend({
        className: "banner",
        template: "banner/show/bannermenu.show",
        fastButtonEvents: {
            "click .btn-close": "prevPage",
            "click .btn-menu": "toggleMenu",
            "click .btn-logo": "onHomeClicked",
            "click .btn-home": "onHomeClicked",
            "click .btn-videos": "onVideosClicked",
            "click .btn-logout": "onLockOutClicked",
            "click .btn-pdf-viden": "onPDFVidenClicked",
            "click .btn-administration": "onAdministrationClicked",
            "click .btn-developer": "onDeveloperMenuClicked",
            "click .btn-change-password": "onChangePasswordMenuClicked",
            "click .btn-group-code": "onGroupCodeMenuClicked",
            "click .btn-developer-textbrowser": "onDeveloperTextBrowserClicked",
            "click .refresh-btn": "onRefreshClicked",
            "click .btn-refresh-fr": "onRefreshClickedFR",
            "click .btn-refresh-uni": "onRefreshClickedUNI",
            "click .btnCancel": "onRefreshCancelled"
        },
        ui: {
            refreshDialog: ".confirm-action-overlayer"
        },
        closeButtonIsVisible: false,
        menuButtonIsVisible: true,
        buttonMargin: 19,
        templateHelpers: {
            administration: function () {
                return Administration();
            }
        },
        onRender: function () {
            if (App.UserProfile.userType == "UNI") {
                this.$el.find(".btnConfirm").addClass("btn-refresh-uni");
            }
            else {
                this.$el.find(".btnConfirm").addClass("btn-refresh-fr");
            }
        },
        onShow: function () {
            this.listenTo(_Backbone.history, "all", this.onLocationChanged, this);
            this.listenTo(App.vent, "banner:prevPage", this.prevPage, this);
            this.ui.refreshDialog.hide();
        },
        toggleMenu: function () {
            this.animateButtonFeedback($(".btn-menu"));
            $(".menu-items").toggleClass("display-none");
            if (config.can_lockout) {
                $("li.btn-logout").css("display", "inline");
                $(".row.btn-logout").removeClass("display-none");
            }
            else {
                $("li.btn-logout").css("display", "none");
                $(".row.btn-logout").addClass("display-none");
            }
            if (config.can_change_password) {
                $("li.btn-change-password").css("display", "inline");
                $(".row.btn-change-password").removeClass("display-none");
            }
            else {
                $("li.btn-change-password").css("display", "none");
                $(".row.btn-change-password").addClass("display-none");
            }
            if (config.language == config.languages[1]) {
                $("li.btn-pdf-viden").css("display", "inline");
                $(".row.btn-pdf-viden").removeClass("display-none");
            }
            else {
                $("li.btn-pdf-viden").css("display", "none");
                $(".row.btn-pdf-viden").addClass("display-none");
            }
            if (config.can_change_dataset) {
                $("li.btn-developer").css("display", "inline");
                $(".row.btn-developer").removeClass("display-none");
            }
            else {
                $("li.btn-developer").css("display", "none");
                $(".row.btn-developer").addClass("display-none");
            }
        },
        onHomeClicked: function () {
            this.animateButtonFeedback($(".btn-home"));
            _Backbone.history.navigate("", true);
            if (!$(".menu-items").hasClass("display-none"))
                this.toggleMenu();
        },
        prevPage: function () {
            this.animateButtonFeedback($(".btn-close"));
            var fragment = _Backbone.history.getFragment();
            var url = "";
            if (/configuration/.test(fragment))
                url = "#workspace/{0}/{1}".format(App.currentModule, App.currentLevel.toString());
            if (/exercise/.test(fragment))
                url = "#configuration/{0}/{1}/{2}/{3}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise);
            _Backbone.history.navigate(url, true);
        },
        animateButtonFeedback: function (el) {
            TweenMax.fromTo(el, 0.2, { scale: 1.2 }, { scale: 1 });
        },
        onLocationChanged: function () {
            this.check_what_menu_elements_should_be_shown();
            this.setElementColorBasedOnUrlFragment();
        },
        setElementColorBasedOnUrlFragment: function () {
            if (/test/.test(_Backbone.history.getFragment())) {
                this.$el.find(".btn-close").removeClass("interface-btn-tilbage").addClass("interface-btn-back-white");
                this.$el.find(".btn-logo").removeClass("interface-logo").addClass("interface-logo-dark");
            }
            else {
                this.$el.find(".btn-close").removeClass("interface-btn-back-white").addClass("interface-btn-tilbage");
                this.$el.find(".btn-logo").removeClass("interface-logo-dark").addClass("interface-logo");
            }
        },
        check_what_menu_elements_should_be_shown: function (e) {
            var value = _Backbone.history.getFragment();
            if (value == "")
                this.hideCloseAndResetMenuButton();
            if (/workspace|configuration|diploma|videos/.test(value))
                this.showMainAndCloseButtons();
            if (/test|exercise|result/.test(value))
                this.hideMainButton();
        },
        showMainAndCloseButtons: function (args) {
            if (!this.menuButtonIsVisible) {
                $(".main-menu .menu-items").addClass("display-none");
                Animations.bouncy($(".main-menu"), "top", this.buttonMargin);
                this.menuButtonIsVisible = true;
            }
            if (this.closeButtonIsVisible)
                return;
            $(".btn-close").css({ top: -100 }).removeClass("display-none");
            Animations.bouncy($(".main-menu"), "left", 83);
            Animations.bouncy($(".btn-close"), "top", this.buttonMargin);
            this.closeButtonIsVisible = true;
        },
        hideCloseAndResetMenuButton: function (args) {
            if (!this.closeButtonIsVisible)
                return;
            Animations.bouncy($(".main-menu"), "left", this.buttonMargin);
            if (!this.menuButtonIsVisible)
                Animations.bouncy($(".main-menu"), "top", this.buttonMargin);
            Animations.bouncy($(".btn-close"), "top", -100).promise().done(function () {
                $(".btn-close").css({ top: -100 }).removeClass("display-none");
            });
            this.closeButtonIsVisible = false;
            this.menuButtonIsVisible = true;
        },
        hideMainButton: function () {
            Animations.bouncy($(".main-menu"), "top", -100).promise().done(function () {
                $(".main-menu").css({ left: 83 });
            });
            this.menuButtonIsVisible = false;
            if (!this.closeButtonIsVisible) {
                $(".btn-close").removeClass("display-none").css({ top: -100, left: this.buttonMargin });
                Animations.bouncy($(".btn-close"), "top", this.buttonMargin);
                this.closeButtonIsVisible = true;
            }
        },
        hideMenuButton: function (args) {
            $(".main-menu .menu-items").addClass("display-none");
            Animations.bouncy($(".main-menu"), "top", -100);
            this.menuButtonIsVisible = false;
        },
        onVideosClicked: function () {
            var path = window.location.toString();
            _Backbone.history.navigate("#videos", true);
            if (path.match(/videos/)) {
                this.toggleMenu();
            }
        },
        onLockOutClicked: function () {
            console.log("onLockOutClicked");
            Server.logout().done(function () {
                window.location.href = "http://" + window.location.host;
            });
            this.toggleMenu();
        },
        onPDFVidenClicked: function () {
            var vidensbogUrl = "assets/pdf/frontread-vidensbog-{0}.pdf".format(App.request("language"));
            window.open(vidensbogUrl, "_blank", "location=no");
            this.toggleMenu();
        },
        onAdministrationClicked: function () {
            TokenRenewer(function (err, data) {
                if (err) {
                    console.error("could not get new token for administration id:" + localStorage.getItem("userid"));
                }
                else {
                    if (config.mobile_app) {
                        window.open(App.serverUrl + "?frontreadtoken=" + data, "location=no");
                    }
                    else {
                        localStorage.setItem("backurl", window.location.href);
                        window.open(App.serverUrl + "?frontreadtoken=" + data, "_self");
                    }
                }
            });
            this.toggleMenu();
        },
        onDeveloperMenuClicked: function () {
            App.vent.trigger("show:developermenu");
        },
        onChangePasswordMenuClicked: function () {
            App.vent.trigger("show:change-password-menu");
        },
        onGroupCodeMenuClicked: function () {
            App.vent.trigger("show:group-code-menu");
        },
        onDeveloperTextBrowserClicked: function () {
            App.vent.trigger("show:developer-textbrowser");
        },
        onRefreshClicked: function () {
            this.ui.refreshDialog.show();
        },
        onRefreshClickedFR: function () {
            var that = this;
            console.log("Refresh FrontRead data");
            Server.authenticateUser(App.UserProfile.username, App.UserProfile.password)
                .done(function (data) {
                console.log("FrontRead data refreshed");
                Server.loadUserData();
                that.ui.refreshDialog.hide();
            }).fail(function (data) {
                console.log("FrontRead data not refreshed");
            });
        },
        onRefreshClickedUNI: function () {
            var that = this;
            console.log("Refresh data");
            $.ajax({
                url: App.ServerUrl() + "/changeGroup",
                type: 'POST',
                cache: true,
                dataType: 'json',
                headers: {
                    Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                },
                data: {
                    userid: localStorage.getItem("userid"),
                    groupCode: localStorage.getItem("groupCode")
                }
            }).done(function (data) {
                if (data._saveData._id) {
                    App.UserProfile.savedataID = data._saveData._id;
                }
                ///Data reguarding unlocked and videofreee should be present in this data
                config.ProcessDescription(data);
                Server.loadUserData()
                    .done(function (data) {
                    console.log("Data refreshed");
                })
                    .fail(function (data) {
                    console.log("Data not refreshed");
                });
                that.ui.refreshDialog.hide();
            }).fail(function (data) {
                console.error("not a valid id error: " + JSON.stringify(data));
            });
        },
        onRefreshCancelled: function () {
            this.ui.refreshDialog.hide();
        }
    });
});
//# sourceMappingURL=banner.show.js.map;
 /***************************/ 
App.module("dialogs.datasync", function (datasync, App, _Backbone, Marionette, $, _) {
    var Page = Marionette.ItemView.extend({
        className: "dialog datasync",
        template: "dialogs/datasync/show/datasync.show",
        events: {
            "click .btnUseServerVersion": "useServerVersion",
            "click .btnUseLocalVersion": "useLocalVersion"
        },
        templateHelpers: {
            getServerWpm: function () {
                return this.serverSynchInfo.syncdata.wpm;
            },
            getServerExercisesCompleteCount: function () {
                var data = this.serverSynchInfo.syncdata;
                return data.numExercisesCompleted + "/" + data.numExercises;
            },
            getServerTestsCompleteCount: function () {
                return this.serverSynchInfo.syncdata.numTestsCompleted + "/4";
            },
            getLocalWpm: function () {
                return this.localSynchInfo.wpm;
            },
            getLocalTestsCompleteCount: function () {
                return this.localSynchInfo.numTestsCompleted + "/4";
            },
            getLocalExercisesCompleteCount: function () {
                var data = this.localSynchInfo;
                return data.numExercisesCompleted + "/" + data.numExercises;
            }
        },
        deferred: null,
        serverSynchInfo: null,
        initialize: function () {
            this.deferred = this.model.get("deferred");
            this.serverSynchInfo = this.model.get("serverSynchInfo").syncdata;
            this.getLocalDataStats();
        },
        getLocalDataStats: function () {
            var tests = App.userdata.tests;
            var modules = App.userdata.modules;
            var numExercisesComplete = 0;
            var numExercises = 0;
            var numTestComplete = 0;
            _.each(modules, function (module) {
                _.each(module.levels, function (level) {
                    _.each(level.exercises, function (exercise) {
                        _.each(exercise.attempts, function (attempt) {
                            if (attempt.isComplete) {
                                numExercisesComplete++;
                            }
                            numExercises++;
                        });
                    });
                });
            });
            _.each(tests, function (test) {
                if (test.isComplete)
                    numTestComplete++;
            });
            var data = {
                numTestsCompleted: numTestComplete,
                numExercises: numExercises,
                numExercisesCompleted: numExercisesComplete
            };
            this.model.set("localSynchInfo", data);
        },
        onShow: function () {
            console.log(this.serverSynchInfo);
        },
        useServerVersion: function () {
            this.deferred.resolve();
            this.closeDialog();
        },
        useLocalVersion: function () {
            this.deferred.reject();
            this.closeDialog();
        },
        closeDialog: function () {
            App.vent.trigger("close:dialog.datasync");
        }
    });
    var Controller = {
        show: function (data) {
            var model = new _Backbone.Model(data);
            var page = new Page({ model: model });
            App.dialogRegion.show(page);
            $(App.dialogRegion.el).removeClass("display-none");
        },
        hide: function () {
            App.dialogRegion.reset();
            $(App.dialogRegion.el).addClass("display-none");
        }
    };
    App.vent.bind("show.data.synch.dialog", function (data) {
        Controller.show(data);
    });
    App.vent.bind("close:dialog.datasync", function () {
        Controller.hide();
    });
});
//# sourceMappingURL=datasync.show.js.map;
 /***************************/ 
App.module("Pages.Configuration", function (Configuration, App, _Backbone, Marionette, $, _) {
    Configuration.Controller = {
        createPage: function () {
            return this.getConfigurationPageByExerciseID();
        },
        getConfigurationPageByExerciseID: function () {
            if (_Backbone.history.getFragment().indexOf("f4") < 0)
                return new Configuration.ExerciseConfigurationPage();
            else
                return new Configuration.ExerciseConfigurationPageF4();
        }
    };
});
//# sourceMappingURL=configuration.controller.js.map;
 /***************************/ 
App.module("Pages.Configuration", function (Configuration, App, _Backbone, Marionette, $, _) {
    Configuration.ExerciseConfigurationPage = FlowPage.extend({
        template: "pages/configuration/show/configuration",
        fastButtonEvents: {
            "click .btnNextAttempt": "onClicked",
            "click .btnStartExercise": "onStartExercise",
            "click .btn-close": "onCloseClicked"
        },
        events: {
            "click .progress-box:not(.not-attempted)": "onClicked",
            "click .attempt.complete": "onClicked",
            "click .attempt.failed": "onClicked",
        },
        regions: {
            "attemptsRegion": ".attempts",
        },
        templateHelpers: {
            getTitle: function () {
                var title = "";
                switch (this.exerciseID) {
                    case "f1":
                        title = App.translate("fiksering-single");
                        break;
                    case "f2":
                        title = App.translate("spaendevidde-single");
                        break;
                    case "f3":
                        title = App.translate("arbejdshukommelse-single");
                        break;
                    case "f4":
                        title = App.translate("laesetraening-single");
                        break;
                }
                return title;
            },
            getType: function () {
                var title = "";
                switch (this.exerciseID) {
                    case "f1":
                        title = "F1";
                        break;
                    case "f2":
                        title = "F2";
                        break;
                    case "f3":
                        title = "F3";
                        break;
                    case "f4":
                        title = "F4";
                        break;
                }
                return title;
            },
            getIcon: function () {
                return "interface-{0}-icon-small".format(this.exerciseID);
            },
            getSkin: function () {
                return this.exerciseID == "f4" ? "darkSkin" : "";
            },
            getCurrentSetting: function () {
                if (this.exerciseID == "f4") {
                    return App.request("entities:wpm-by-level") + " " + App.translate("opm");
                }
                else {
                    return (App.request("configuration:exercise:niveau").blinkSpeed / 1000).toFixed(2) + " " + App.translate("sek");
                }
            },
            getCurrentValue: function () {
                if (this.exerciseID == "f4") {
                    return App.request("entities:wpm-by-level");
                }
                else {
                    return App.request("configuration:exercise:niveau").blinkSpeed;
                }
            },
            getSettingType: function () {
                return this.exerciseID == "f4" ? App.translate("opm") : App.translate("blinketid");
            },
            getSettingLable: function () {
                return this.exerciseID == "f4" ? App.translate("opm-explain") : App.translate("blink");
            },
            getSettings: function () {
                var data = [];
                var step = 25;
                if (this.exerciseID == "f4") {
                    var recommended = App.request("entities:wpm-by-level");
                    console.log("creating recommended settings for f4: " + recommended);
                    // Find selected last speed if any for this particilare level
                    console.log("Current level: " + App.currentLevel);
                    var moduleIndex = Math.floor((App.currentLevel - 1) / 3);
                    var levelIndex = (App.currentLevel - 1) - (moduleIndex * 3);
                    var exercises = App.userdata.modules[moduleIndex].levels[levelIndex].exercises[3];
                    var latestWpmThisLevel = 0;
                    for (var i = 0; i < 4; i++) {
                        if (exercises.attempts[i].isComplete) {
                            if (exercises.attempts[i].blinkSpeed != 0) {
                                latestWpmThisLevel = exercises.attempts[i].blinkSpeed;
                            }
                        }
                    }
                    console.log("Latest WPM this level " + latestWpmThisLevel);
                    /// Calculate lowest possible setting for f4
                    var start = 0;
                    //if (recommended < 100) {
                    start = step + recommended % step;
                    //}
                    //else {
                    //    start = recommended - step * 4;
                    //}
                    var latestWpmThisLevelFound = false;
                    for (var i = start; i <= recommended + step * 10; i += step) {
                        if (i == latestWpmThisLevel) {
                            latestWpmThisLevelFound = true;
                        }
                    }
                    /*
                    data.push({
                        value: this.getCurrentValue(),
                        label: this.getCurrentValue() + " " + App.translate("opm"),
                        current: true
                    });
                    */
                    for (var i = start; i <= recommended + step * 10; i += step) {
                        if (i == latestWpmThisLevel) {
                            data.push({
                                value: i,
                                label: i + " " + App.translate("opm"),
                                current: true
                            });
                        }
                        else if (i == recommended) {
                            data.push({
                                value: i,
                                label: i + " " + App.translate("opm") + ", " + App.translate("standard-single"),
                                current: !latestWpmThisLevelFound
                            });
                        }
                        else {
                            data.push({
                                value: i,
                                label: i + " " + App.translate("opm"),
                                current: i == recommended
                            });
                        }
                    }
                    //data = data.sort(function (a, b) {
                    //return a.value < b.value ? -1 : 1
                    //})
                }
                else {
                    var current = App.request("configuration:exercise:niveau").blinkSpeed;
                    function isCurrent(value) {
                        if (value == current)
                            return " " + App.translate("standard-single-small");
                        return "";
                    }
                    // from 1000 to 100
                    for (var i = 1000; i > 100; i -= step)
                        data.push({
                            value: i,
                            label: (i / 1000).toFixed(2) + " " + App.translate("sek") + isCurrent(i),
                            current: (i == current)
                        });
                    // from 100 to 20
                    for (var i = 100; i > 30; i -= 10)
                        data.push({
                            value: i,
                            label: (i / 1000).toFixed(2) + " " + App.translate("sek") + isCurrent(i),
                            current: (i == current)
                        });
                }
                return data;
            }
        },
        initialize: function () {
            App.setQueryFromFragment();
            var querry = "module: {0}, level: {1}, exercise: {2}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise);
            var data = App.request("entities:data:query", querry);
            this.model = new _Backbone.Model(data);
        },
        onShow: function () {
            this.createAttemptResults();
            this.setAttemptStatus();
            this.setCurrentAttempt();
            this.checkIfTheNextAttemptButtonShouldBeVisible();
            // here the current attempt wil be calculated.
            App.currentAttempt = this.getCurrentAttempt();
            _Backbone.history.navigate("#configuration/" + App.getQuerryString(), { trigger: false, replace: true });
            this.onShowComplete();
            this.createSelectBindings();
            switch (App.currentExercise) {
                case "f1":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(3);
                    break;
                case "f2":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(4);
                    break;
                case "f3":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(5);
                    break;
                case "f4":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(6);
                    break;
            }
        },
        onClose: function () {
            $("select").unbind("change");
        },
        transitionIn: function () {
            var delay = 0.1;
            var top = (($(window).height() - 43) * 0.5) - 275; //((Window height - bottom banner) * 50%) - half the height of the element -> to place it in the middle of the screen 
            TweenMax.fromTo($(".configuration-wrapper"), 0.5, {
                force3D: true,
                scale: 0,
                top: top,
                autoAlpha: 0
            }, { scale: 1, top: top, ease: Power3.easeOut, autoAlpha: 1, delay: delay });
            TweenMax.fromTo($(".progress-container"), 0.5, { force3D: true, left: 100 }, { left: 560, delay: delay });
            setTimeout(this.transitionInComplete.bind(this), 500);
        },
        transitionOut: function () {
            var delay = 0;
            TweenMax.fromTo($(".configuration-wrapper"), 0.5, { force3D: true, scale: 1, autoAlpha: 1 }, {
                scale: 0,
                autoAlpha: 0,
                delay: delay,
                ease: Power3.easeOut
            });
            setTimeout(this.transitionOutComplete.bind(this), 200);
        },
        isSelectOpen: false,
        createSelectBindings: function () {
            var select = this.$el.find("select");
            var textClass = this.$el.find(".text");
            select.bind("change", function () {
                textClass.text(($("select option:selected").text()).replace((config.language + "").toUpperCase(), "")
                    .replace(App.translate("standard-single-small"), "")
                    .replace(", " + App.translate("standard-single"), "").trim());
            });
            textClass.text(this.trimmedSting($("select option:selected").text()));
        },
        trimmedSting: function (stringWithISO_3AndRecommanded) {
            return stringWithISO_3AndRecommanded.replace((config.language + "").toUpperCase(), "")
                .replace(App.translate("standard-single-small"), "")
                .replace(", " + App.translate("standard-single"), "").trim();
        },
        createAttemptResults: function () {
            var collection = new _Backbone.Collection(this.getSortedAttemptResults());
            collection.each(function (model, index) {
                model.set({ "attempt": index + 1 });
            });
            var attempts = new Attempts({ collection: collection });
            this.attemptsRegion.show(attempts);
        },
        getSortedAttemptResults: function () {
            return _.filter(this.model.get("attempts"), function (attempt) {
                return (attempt.correctCount || attempt.wrongCount || attempt.wordCount);
            });
        },
        setAttemptStatus: function () {
            _.each(this.model.attributes.attempts, this.setAttemptState.bind(this));
        },
        setAttemptState: function (attempt, i) {
            this.$el.find(".progress-box").eq(i).addClass(this.getAttemptStatus(attempt, this.model.get("exerciseID")));
        },
        getAttemptStatus: function (object, exerciseID) {
            return App.request("getAttemptStatusClass", object, exerciseID);
        },
        setCurrentAttempt: function () {
            if (!this.$el.find(".progress-box.failed").length && !this.$el.find(".progress-box.current").length)
                this.$el.find(".progress-box.not-attempted:first").removeClass("not-attempted").addClass("current");
        },
        getCurrentAttempt: function () {
            var currentAttempt = 1;
            this.$el.find(".progress-box").each(function (i) {
                if ($(this).hasClass("current") || $(this).hasClass("failed"))
                    currentAttempt = i + 1;
            });
            return currentAttempt;
        },
        onClicked: function (e) {
            // FIXME: This seems exploitable
            var clickedAttempt = $(e.currentTarget).data("attempt");
            if (clickedAttempt !== undefined) {
                App.currentAttempt = parseInt(clickedAttempt);
            }
            this.showConfigurationPane();
        },
        showConfigurationPane: function () {
            this.$el.find(".settings").removeClass("display-none");
            this.$el.find(".resultater").addClass("display-none");
            $("input:radio[name=selectSettings][disabled=false]:first").attr('checked', true);
            var $parentDiv = $('.tableContainer');
            setTimeout(function () {
                $parentDiv.scrollTop($parentDiv.scrollTop());
            }, 1212);
        },
        onStartExercise: function () {
            // Grap the settings.
            App.userDefinedExerciseSetting = parseInt($("select#selectSettings").val());
            ////Variant from when app broke drop the dropdown
            //App.userDefinedExerciseSetting = parseInt($('input[name=selectSettings]:checked').val());
            _Backbone.history.navigate("#exercise/" + App.getQuerryString(), true);
        },
        onCloseClicked: function () {
            App.vent.trigger("banner:prevPage");
        },
        checkIfTheNextAttemptButtonShouldBeVisible: function () {
            var querry = "module: {0}, level: {1}, exercise: {2}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise);
            var data = App.request("entities:data:query", querry);
            var numComplete = _.filter(data.attempts, function (obj) {
                return obj.isComplete;
            }).length;
            var numFailed = _.filter(data.attempts, function (obj) {
                return ((obj.correctCount > 0 || obj.wrongCount > 0) && !obj.isComplete);
            }).length;
            var doHide = (numComplete + numFailed) == 4 || numFailed > 0;
            var $btnNext = this.$el.find(".btnNextAttempt");
            if (doHide) {
                $btnNext.hide();
            }
            else {
                $btnNext.show();
            }
        }
    });
    // ---------------------------------------------------------------------------------------------------------
    Configuration.ExerciseConfigurationPageF4 = Configuration.ExerciseConfigurationPage.extend({
        className: "configurationpage-f4",
        template: "pages/configuration/show/configurationf4",
        regions: {
            "attemptsRegion": ".attempts",
            "objectiveRegion": ".validated-responses .content"
        },
        transitionIn: function () {
            var userResponses = App.request("get:saved:responses");
            if (userResponses == "") {
                this.animationUserResponses();
            }
            else {
                // If there is saved responses show the responses
                //console.log("console.log(userResponses1);" + userResponses);
                //console.log("console.log(userResponses2);" + JSON.stringify(userResponses));
                ///Only show what the student answered instead of all 3 options
                for (var i = 0; i < userResponses.length; i++) {
                    var trimmedResponsArray = [userResponses[i].responses[0]];
                    //console.log("console.log(userResponses3);"  + JSON.stringify(userResponses[i].responses));
                    for (var j = 0; j < userResponses[i].responses.length; j++) {
                        //console.log("console.log(userResponses4);"  + JSON.stringify(userResponses[i].responses[j]));
                        if (userResponses[i].responses[j].state != "") {
                            //console.log("console.log(userResponses5);" + JSON.stringify(userResponses[i].responses[j]));
                            trimmedResponsArray = [userResponses[i].responses[j]];
                        }
                    }
                    userResponses[i].responses = trimmedResponsArray;
                }
                ///End of ///Only show what the student answered instead of all 3 options
                this.objectiveRegion.show(new Objectives({ collection: new _Backbone.Collection(userResponses) }));
                this.animationUserResponses();
            }
            setTimeout(this.transitionInComplete.bind(this), 500);
        },
        animationDefault: function () {
            var delay = 0.1;
            var ease = Power3.easeInOut;
            TweenMax.fromTo($(".configuration-wrapper"), 0.5, { force3D: true, scale: 0, left: 300, top: 100, autoAlpha: 0 }, { force3D: true, scale: 1, left: 300, top: 100, ease: Power3.easeOut, autoAlpha: 1, delay: delay });
            TweenMax.fromTo($(".progress-container"), 0.5, { left: 100 }, { left: 390, delay: delay });
        },
        animationUserResponses: function () {
            var delay = 0.6;
            var ease = Power3.easeInOut;
            var $el = $(".configuration-wrapper");
            var $el1 = $(".progress-container");
            var $el2 = $(".validated-responses");
            TweenMax.fromTo($el, 0.5, { force3D: true, scale: 0.5, left: 300, top: 100, autoAlpha: 0 }, { force3D: true, scale: 1, top: 100, ease: Power3.easeOut, autoAlpha: 1 });
            TweenMax.to($el, 0.5, { left: 512, delay: 0.5, ease: ease });
            TweenMax.fromTo($el1, 0.5, { left: 100 }, { left: 390, delay: delay, ease: ease });
            TweenMax.fromTo($el2, 0.5, { force3D: true, left: 20, width: 491, scale: 1, rotationY: 90, display: "block" }, { force3D: true, scale: 1, rotationY: 0, delay: 0.5, ease: ease });
        },
        transitionOut: function () {
            var delay = 0;
            TweenMax.fromTo($(".configuration-wrapper"), 0.5, { force3D: true, scale: 1, autoAlpha: 1 }, {
                scale: 0,
                autoAlpha: 0,
                delay: delay,
                ease: Power3.easeOut
            });
            TweenMax.to($(".validated-responses"), 0.5, { force3D: true, scale: 0, autoAlpha: 0, ease: Power3.easeInOut });
            setTimeout(this.transitionOutComplete.bind(this), 200);
        },
    });
    // ---------------------------------------------------------------------------------------------------------
    var Attempt = Marionette.ItemView.extend({
        className: "attempt",
        template: "",
        templateHelpers: {
            getWordCount: function () {
                return this.wordCount;
            },
            getCorrectCount: function () {
                return this.correctCount;
            },
            getWrongCount: function () {
                return this.wrongCount;
            },
            getPrecentage: function () {
                return (this.correctCount / this.wordCount * 100).toFixed(0);
            },
            getSpeed: function () {
                return this.blinkSpeed;
            },
            getSpeedLable: function () {
                return (App.currentExercise == "f4") ? App.translate("laesehastighed") : App.translate("blinketid");
            }
        },
        initialize: function () {
            this.template = this.usef2SpecialTemplate()
                ? "pages/configuration/show/configuration.attempt-f2-specialcase"
                : "pages/configuration/show/configuration.attempt";
        },
        usef2SpecialTemplate: function () {
            // should be used when the f2 act as an auto word display list.
            return /m1\/3\/f2|m2\/6\/f2|m3\/9\/f2/.test(_Backbone.history.getFragment());
        },
        onShow: function () {
            var object = this.model.attributes;
            var correctPrecentage = object.correctCount / object.wordCount * 100;
            var className = App.request("getAttemptStatusClass", object, App.currentExercise);
            this.$el.data("attempt", this.model.get("attempt"));
            this.$el.addClass(className);
        }
    });
    // ---------------------------------------------------------------------------------------------------------
    var Attempts = Marionette.CollectionView.extend({
        itemView: Attempt
    });
    // ---------------------------------------------------------------------------------------------------------
    var Response = Marionette.ItemView.extend({
        tagName: "li",
        onShow: function () {
            this.$el.text(this.model.get("text"));
            this.$el.addClass(this.model.get("state"));
            if (this.model.get("isTheCorrectResponse")) {
                this.$el.css({ color: "green" });
            }
        }
    });
    // ---------------------------------------------------------------------------------------------------------
    var Objective = Marionette.CompositeView.extend({
        template: "pages/tests/readspeed/result/test.result.objective",
        itemView: Response,
        itemViewContainer: "ul",
        initialize: function () {
            this.collection = new _Backbone.Collection(this.model.get("responses"));
        }
    });
    // ---------------------------------------------------------------------------------------------------------
    var Objectives = Marionette.CollectionView.extend({
        itemView: Objective
    });
});
/*
Radio button selection system to be used next time apple introduces a dropdown button bug as they did with IOS 11.0.0 and only fixed again in 11.2.0

<form>
                        <div class="ui-select frontread-skin">
                            <div class="ui-overlayer"></div>
                            <select name="selectSettings" class="selectSettings" id="selectSettings" style="width:200px"
                                    onchange="changeFunc();">
                                <%
                                var options = getSettings();
                                if(options)
                                {
                                for(let i = 0; i < options.length; i++)
                                {%>
                                <option value="<%=options[i].value%>"><%=options[i].label%></option>

                                <%}
                                }
                                %>
                            </select>
                        </div>


                            <div style="overflow: auto;height: 190px; width: 100%;" id="tableContainer">
                                <table style="width: 300px;" cellpadding="0" cellspacing="0">

                                    <%
                                    var options = getSettings();
                                    for(let i = 0; i < options.length; i++)
                                    {
                                    if(getCurrentValue() == options[i].value)
                                    {
                                    %>


                                    <tr>
                                        <td><a><input type="radio" id="<%=options[i].value%>"
                                                      name="selectSettings" value="<%=options[i].value%>" checked
                                                      autofocus></a></td>
                                        <td><label id="tableActiveLabel" for="<%=options[i].value%>"><a><%=options[i].label%></a></label></td>
                                    </tr>
                                    <%}
                                    else
                                    {%>
                                    <tr>
                                        <td><a><input type="radio" id="<%=options[i].value%>"
                                                      name="selectSettings" value="<%=options[i].value%>"></a></td>
                                        <td><label for="<%=options[i].value%>"><a><%=options[i].label%></a></label></td>
                                    </tr>
                                    <%}%>


                                    <%}%>
                                </table>
                            </div>
                        </div>


                        <br/>
                        <br/>
                        <div class="button large dark btnStartExercise"> <%= translate("start-oevelse") %></div>
                    </form>

*/ 
//# sourceMappingURL=configuration.show.js.map;
 /***************************/ 
App.module("Pages.Diploma", function (Diploma, App, _Backbone, Marionette, $, _) {
    Diploma.Page = FlowPage.extend({
        className: "diplomaPage",
        template: "pages/diploma/show/diploma.show",
        templateHelpers: {
            getCurrentWPM: function () {
                return App.request("entities:latest-wpm-from-tests");
            },
            getCurrentImprovement: function () {
                return App.request("entities:wpm-increase");
            },
            getUsername: function () {
                return localStorage.getItem("username");
            }
        },
        events: {
            "click .btn-instagram": "shareOnInstagram",
            "click .btn-twitter": "shareOnTwitter",
            "click .btn-facebook": "shareOnFacebook",
        },
        initialize: function () {
            this.listenTo(App.vent, "changeInUserData", this.onShow, this);
        },
        onShow: function () {
            this.$el.find(".username").text(App.userdata.name.length <= 30 ? App.userdata.name : App.userdata.name.substring(0, 27) + "...");
        },
        transitionIn: function () {
            var delay = 0.1;
            TweenMax.fromTo($(".diploma-wrapper"), 0.5, { scale: 0, autoAlpha: 0 }, { scale: 1, ease: Power3.easeOut, autoAlpha: 1, delay: delay });
            setTimeout(this.transitionInComplete.bind(this), 500);
        },
        transitionOut: function () {
            var delay = 0;
            TweenMax.fromTo($(".diploma-wrapper"), 0.5, { scale: 1, autoAlpha: 1 }, {
                scale: 0,
                autoAlpha: 0,
                delay: delay,
                ease: Power3.easeOut
            });
            setTimeout(this.transitionOutComplete.bind(this), 200);
        },
        shareOnInstagram: function () {
            console.log("shareOnInstagram");
            createCanvasDiploma(App.userdata.name, App.request("entities:latest-wpm-from-tests"), App.request("entities:wpm-increase"), function (canvas, context, dataURL) {
                Instagram.share(dataURL, function (err) {
                    if (err) {
                        console.log("not shared");
                    }
                    else {
                        console.log("shared");
                    }
                });
            });
        },
        shareOnTwitter: function () {
            console.log("shareOnTwitter");
            var improvment = App.request("entities:wpm-increase");
            var message = encodeURI("Jeg har gennemført Frontread med en forøgelse af min læsehastighed på {0}%".format(improvment));
            var url = "https://twitter.com/intent/tweet?button_hashtag=frontread&text={0}".format(message);
            window.open(url, '_blank');
        },
        shareOnFacebook: function () {
            var username = App.userdata.username;
            var readspeed = "301";
            var improvment = App.request("entities:wpm-increase");
            var shareLink = escape("http://www.frontread.dk//frontread-facebook-diplom/facebook-diploma.html?username={0}&readspeed={1}&improvment={2}".format(username, readspeed, improvment));
            var url = "http://www.facebook.com/sharer.php?p[url]={0}".format(shareLink);
            window.open(url, '_blank');
        },
    });
    function createCanvasDiploma(username, readspeed, improvment, callback) {
        var c = document.createElement("canvas");
        c.width = 585;
        c.height = 542;
        var ctx = c.getContext("2d");
        var img = new Image();
        img.src = "assets/images/instagram/diplom_instagram_small.png";
        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            ctx.fillStyle = "#ff0000";
            ctx.font = "30px neo-sans-bold";
            ctx.textAlign = "center";
            ctx.fillText(username, 300, 240);
            ctx.font = "16px neo-sans-bold";
            ctx.textAlign = "center";
            ctx.fillText(improvment, 300, 363);
            callback(c, ctx, c.toDataURL("image/jpeg", 1.0));
        };
    }
    App.commands.setHandler("create-instergram-picture", function (username, readspeed, improvment, callback) {
        createCanvasDiploma(username, readspeed, improvment, callback);
    });
});
//# sourceMappingURL=diploma.show.js.map;
 /***************************/ 
App.module("Pages.F1.Exercise", function (Exercise, App, _Backbone, Marionette, $, _) {
    Exercise.Controller = {
        create: function (data, configuration) {
            var objectives = new _Backbone.Collection(data);
            var model = new _Backbone.Model(configuration);
            return new Exercise.Page({ collection: objectives, model: model });
        }
    };
});
//# sourceMappingURL=f1.exercise.controller.js.map;
 /***************************/ 
App.module("Pages.F1.Exercise", function (Exercise, App, _Backbone, Marionette, $, _) {
    Exercise.Page = Marionette.Layout.extend({
        template: "pages/f1/exercise/show/f1.page",
        className: "f1",
        regions: {
            taskRegion: ".taskRegion",
            keyboardRegion: ".keyboardRegion",
            messageRegion: ".messageRegion",
        },
        ui: {
            lblBlinkSpeed: ".lblBlinkSpeed",
            lblProgress: ".lblProgress",
            lblTotal: ".lblTotal",
            lblBlinkText: ".lblBlinkText",
            lblInputText: ".lblInputText",
            lblModule: ".lblModule",
            lblNiveau: ".lblNiveau",
            lblAttempt: ".lblAttempt"
        },
        fastButtonEvents: {
            "click .btn-continue": "triggerKeyboardSubmit",
            "click .btn-aprove": "triggerKeyboardSubmit",
        },
        pageProgress: 1,
        initialize: function () {
            this.userResponses = [];
            this.listenTo(App.vent, "exercise:progress:updated", this.updateProgress, this);
            App.reqres.setHandler("exercise:save-response", this.saveResponse, this);
        },
        onShow: function () {
            this.updateInterfaceText();
            this.messageBox = new MessageBox(".messageBox");
            //this.keyboard = App.request("create:keyboard");
            this.keyboard = App.request("create:keyboard:touch");
            this.keyboardRegion.show(this.keyboard);
            this.createSeequence();
            this.revealMessageBox();
        },
        onClose: function () {
            App.reqres.removeHandler("exercise:save-response");
            this.sequence.destroy();
        },
        triggerKeyboardSubmit: function () {
            this.$el.find(".btn-continue").hide();
            this.keyboard.onSubmit();
        },
        updateInterfaceText: function () {
            this.ui.lblBlinkSpeed.text(+this.model.get("blinkSpeed") / 1000);
            this.ui.lblProgress.text(1);
            this.ui.lblTotal.text(this.collection.length);
            this.ui.lblModule.text(App.currentModule.match(/\d/)[0]);
            this.ui.lblNiveau.text(App.currentLevel);
            this.ui.lblAttempt.text(App.currentAttempt);
        },
        createSeequence: function () {
            var that = this;
            var sequence = new commands.SerialCommand();
            sequence.on("command:complete", this.onSequenceComplete, this);
            this.sequence = sequence;
            this.collection.each(function (data, i) {
                sequence.addCommand(that.createBlinkCommand(data, i == 0));
                sequence.addCommand(that.createTextInputCommand());
            });
            sequence.execute();
        },
        createBlinkCommand: function (data, shouldCreateBlinkThatWaitsForUserInput) {
            var args = {
                model: this.model,
                data: data.attributes,
                region: this.taskRegion,
                keyboard: this.keyboard,
                messageBox: this.messageBox
            };
            if (shouldCreateBlinkThatWaitsForUserInput)
                return new BlinkCommand(args);
            else
                return new BlinkCommandNoWaitForUserInput(args);
        },
        createTextInputCommand: function () {
            return new TextInputCommand({
                reqres: App.reqres,
                vent: App.vent,
                region: this.taskRegion,
                keyboard: this.keyboard,
                messageBox: this.messageBox,
                numChareters: this.model.get("numChareters")
            });
        },
        revealMessageBox: function () {
            setTimeout(function () {
                $(".messageBox>.message02").removeClass("display-none");
            }, 1000);
        },
        updateProgress: function () {
            this.pageProgress++;
            if (this.pageProgress <= this.collection.length)
                this.ui.lblProgress.text(this.pageProgress);
        },
        saveResponse: function (userResponse) {
            var correctValue = this.collection.at(this.pageProgress - 1).get("value");
            this.userResponses.push(userResponse);
            return correctValue == userResponse;
        },
        calculatErrors: function () {
            var errorCount = 0;
            var that = this;
            this.collection.each(function (model, i) {
                var objective = +model.get("value");
                var response = +that.userResponses[i];
                if (objective !== response)
                    errorCount++;
            });
            return errorCount;
        },
        onSequenceComplete: function () {
            console.log('SequenceComplete');
            console.log('------------------');
            this.keyboard.setState(this.keyboard.states.DISABLED);
            var errorCount = this.calculatErrors();
            var wordCount = this.collection.length;
            var correctCount = (wordCount - errorCount < 0) ? 0 : wordCount - errorCount;
            var appData = App.getCurrentExerciseData();
            appData.wordCount = wordCount;
            appData.objectivesCount = wordCount;
            appData.wrongCount = errorCount;
            appData.correctCount = correctCount;
            appData.blinkSpeed = parseInt(this.model.get("blinkSpeed")) / 1000;
            appData.isComplete = App.request("exerciseCompleationStatus", appData, "f1");
            App.execute("entities:data:save");
            setTimeout(function () {
                _Backbone.history.navigate(App.getCreateConfigurationPageQuery(), true);
            }, 200);
        }
    });
});
//# sourceMappingURL=f1.show.js.map;
 /***************************/ 
App.module("Pages.F1", function (F1, App, _Backbone, Marionette, $, _) {
    F1.Controller = {
        createExerscisePage: function (region) {
            console.log("F1 controller - create exerscise page");
            var configuration = App.request("configuration:exercise:niveau");
            configuration.blinkSpeed = App.userDefinedExerciseSetting;
            var data = App.request("exercise:data");
            var objectives = new _Backbone.Collection(data);
            var model = new _Backbone.Model(configuration);
            var view = new F1.Exercise.Page({ collection: objectives, model: model });
            region.show(view);
        }
    };
});
//# sourceMappingURL=f1.controller.js.map;
 /***************************/ 
App.module("Pages.F2.Exercise", function (Exercise, App, _Backbone, Marionette, $, _) {
    Exercise.PageContinousBlink = Marionette.Layout.extend({
        className: "f2",
        template: "pages/f2/exercise/show/f2.blink-list.exercise.show",
        regions: {
            exerciseRegion: ".exerciseRegion"
        },
        events: {
            "click .btnStart": "onBtnStartClicked",
        },
        ui: {
            lblBlinkSpeed: ".lblBlinkSpeed",
            lblProgress: ".lblProgress",
            lblTotal: ".lblTotal",
            lblLevel: ".lblLevel",
            inputStart: ".inputStart",
            inputResponse: ".inputResponse",
            btnCorrect: ".inputResponse .btn-success",
            btnWrong: ".inputResponse .btn-danger",
            infotext: ".infotext",
            lblModule: ".lblModule",
            lblNiveau: ".lblNiveau",
            lblAttempt: ".lblAttempt"
        },
        fastButtonEvents: {
            "click .btnStart": "onStartClicked"
        },
        pageProgress: 1,
        initialize: function () {
        },
        onShow: function () {
            this.updateInterfaceText();
            this.createSeequence();
        },
        onClose: function () {
            this.sequence.destroy();
            this.stopListening();
            console.log("close F2");
        },
        updateInterfaceText: function () {
            this.ui.lblLevel.text(this.model.get("level"));
            this.ui.lblBlinkSpeed.text(+this.model.get("blinkSpeed") / 1000);
            this.ui.lblProgress.text(1);
            this.ui.lblTotal.text(this.collection.length);
            this.ui.lblModule.text(App.currentModule.match(/\d/)[0]);
            this.ui.lblNiveau.text(App.currentLevel);
            this.ui.lblAttempt.text(App.currentAttempt);
        },
        updateProgress: function () {
            if (++this.pageProgress <= this.collection.length)
                this.ui.lblProgress.text(this.pageProgress);
        },
        createSeequence: function () {
            this.sequence = new commands.SerialCommand();
            this.sequence.once("command:complete", this.onSeequenceComplete, this);
            this.listenTo(this.sequence, "subcommand:complete", this.updateProgress, this);
            var that = this;
            this.collection.each(function (model, i) {
                var command = that.createBlinkCommand(model, i == 0);
                that.sequence.addCommand(command);
            });
            this.sequence.execute();
        },
        createBlinkCommand: function (data, waitForUserInput) {
            data.attributes.blinkSpeed = this.model.get("blinkSpeed");
            return new ContinousBlinkCommand({
                model: data,
                region: this.exerciseRegion,
                waitForUserInput: waitForUserInput
            });
        },
        onBtnStartClicked: function () {
            $(".btnStart").css({ visibility: "hidden" });
        },
        onSeequenceComplete: function () {
            var numObjectives = this.collection.length;
            var numCorrectResponsess = numObjectives;
            var numWrongResponses = 0;
            console.log("All complete");
            console.log("numObjectives:", numObjectives);
            console.log("numCorrectResponsess:", numCorrectResponsess);
            console.log("numWrongResponses:", numWrongResponses);
            console.log("blinkSpeed", this.model.get("blinkSpeed"));
            var data = {
                wordCount: numObjectives,
                wrongCount: numWrongResponses,
                correctCount: numCorrectResponsess,
                blinkSpeed: +this.model.get("blinkSpeed") / 1000,
                fileName: "N/A" //this.model.get("fileName")
            };
            console.log("saving result", data);
            var appData = App.getCurrentExerciseData();
            appData.wordCount = data.wordCount;
            appData.wrongCount = 0;
            appData.correctCount = 0;
            appData.blinkSpeed = data.blinkSpeed;
            appData.isComplete = true;
            App.execute("entities:data:save", data);
            setTimeout(function () {
                _Backbone.history.navigate(App.getCreateConfigurationPageQuery(), true);
            }, 200);
        }
    });
    Exercise.Page = Marionette.Layout.extend({
        className: "f2",
        template: "pages/f2/exercise/show/f2.exercise.show",
        regions: {
            focalReatchRegion: ".focalReatchRegion"
        },
        ui: {
            lblBlinkSpeed: ".lblBlinkSpeed",
            lblProgress: ".lblProgress",
            lblTotal: ".lblTotal",
            lblLevel: ".lblLevel",
            inputStart: ".inputStart",
            inputResponse: ".inputResponse",
            btnCorrect: ".inputResponse .equal",
            btnWrong: ".inputResponse .not-equal",
            infotext: ".infotext",
            lblModule: ".lblModule",
            lblNiveau: ".lblNiveau",
            lblAttempt: ".lblAttempt"
        },
        fastButtonEvents: {
            "click .btnStart": "onStartClicked"
        },
        pageProgress: 1,
        initialize: function () {
            console.log("f2 initialize");
            this.createEventHub();
            this.userResponses = [];
        },
        onShow: function () {
            this.createExersice();
            this.updateInterfaceText();
            this.createSeequence();
        },
        destroy: function () {
            this.eventHub.destroy();
        },
        createEventHub: function () {
            this.eventHub = new EventHub();
            this.eventHub.commands.setHandler("updateProgress", this.updateProgress, this);
            this.eventHub.commands.setHandler("saveResponse", this.saveResponse, this);
            this.eventHub.reqres.setHandler("ui", this.getUI, this);
        },
        getUI: function () {
            return this.ui;
        },
        createExersice: function () {
            this.exersice = new Exersice({ model: this.model });
            this.focalReatchRegion.show(this.exersice);
        },
        createBlinkCommand: function (model) {
            return new FocalBlinkCommand({
                view: this.exersice,
                ui: this.ui,
                data: _.extend({}, this.model.attributes, model.attributes)
            });
        },
        createUserInputCommand: function (model) {
            return new UserInputCommand({
                eventHub: this.eventHub,
                model: model
            });
        },
        createSeequence: function () {
            var that = this;
            this.sequence = new commands.SerialCommand();
            this.collection.each(function (model) {
                that.sequence.addCommand(that.createBlinkCommand(model));
                that.sequence.addCommand(that.createUserInputCommand(model));
            });
            this.sequence.once("command:complete", this.onSeequenceComplete, this);
        },
        onStartClicked: function () {
            this.ui.infotext.animate({ opacity: 0 });
            this.ui.inputStart.addClass("display-none");
            this.ui.inputResponse.removeClass("display-none");
            this.sequence.execute();
        },
        saveResponse: function (value) {
            this.userResponses.push(value);
        },
        updateInterfaceText: function () {
            this.ui.lblLevel.text(this.model.get("level"));
            this.ui.lblBlinkSpeed.text(+this.model.get("blinkSpeed") / 1000);
            this.ui.lblProgress.text(1);
            this.ui.lblTotal.text(this.collection.length);
            this.ui.lblModule.text(App.currentModule.match(/\d/)[0]);
            this.ui.lblNiveau.text(App.currentLevel);
            this.ui.lblAttempt.text(App.currentAttempt);
        },
        updateProgress: function () {
            this.pageProgress++;
            if (this.pageProgress <= this.collection.length)
                this.ui.lblProgress.text(this.pageProgress);
        },
        countCorrectResponses: function () {
            var that = this;
            var numCorrectResponsess = 0;
            this.collection.each(function (model, i) {
                if (that.userResponses[i] == that.isCorrectResponse(model))
                    numCorrectResponsess++;
            });
            return numCorrectResponsess;
        },
        isCorrectResponse: function (model) {
            return (model.get("lable") == model.get("value"));
        },
        onSeequenceComplete: function () {
            console.log('Exercise F2 Complete');
            console.log('\tUser Responses:', this.userResponses);
            var numObjectives = this.collection.length;
            var numCorrectResponsess = this.countCorrectResponses();
            var numWrongResponses = numObjectives - numCorrectResponsess;
            console.log("All complete");
            console.log("numObjectives:", numObjectives);
            console.log("numCorrectResponsess:", numCorrectResponsess);
            console.log("numWrongResponses:", numWrongResponses);
            var appData = App.getCurrentExerciseData();
            appData.wordCount = numObjectives;
            appData.objectivesCount = appData.wordCount;
            appData.wrongCount = numWrongResponses;
            appData.correctCount = numCorrectResponsess;
            appData.blinkSpeed = parseInt(this.model.get("blinkSpeed")) / 1000;
            appData.isComplete = App.request("exerciseCompleationStatus", appData, "f2");
            App.execute("entities:data:save");
            setTimeout(function () {
                _Backbone.history.navigate(App.getCreateConfigurationPageQuery(), true);
            }, 200);
        }
    });
    var Exersice = Marionette.Layout.extend({
        className: "focalReatch",
        template: "pages/f2/exercise/show/f2.focalreatch.show",
        regions: {
            "blink1Region": ".blink1Region",
            "blink2Region": ".blink2Region"
        },
        onShow: function () {
            console.log("F2 exercise on show");
            this.$el.width(this.model.attributes.width);
            // dummy	
            this.createBlinkViews(400, "a", "a");
        },
        start: function (data) {
            this.createBlinkViews(this.model.get("blinkSpeed"), data.lable, data.value);
            this.blinkView1.start();
            this.blinkView2.start();
        },
        createBlinkViews: function (shutterSpeed, lable, value) {
            this.blinkView1 = App.request("create:blinkview", this.createBlinkData(shutterSpeed, lable));
            this.blinkView2 = App.request("create:blinkview", this.createBlinkData(shutterSpeed, value));
            this.blink1Region.show(this.blinkView1);
            this.blink2Region.show(this.blinkView2);
            this.listenTo(this.blinkView1, "complete", this.onBlinkViewComplete, this);
        },
        onBlinkViewComplete: function () {
            this.trigger("complete");
        },
        createBlinkData: function (shutterSpeed, value) {
            return {
                delay: 1000,
                shutterspeed: shutterSpeed || 400,
                value: value
            };
        }
    });
    var FocalBlinkCommand = commands.Command.extend({
        initialize: function (options) {
            this.view = options.view;
            this.data = options.data;
            this.ui = options.ui;
        },
        execute: function () {
            this.ui.btnCorrect.addClass("disabled");
            this.ui.btnWrong.addClass("disabled");
            this.listenTo(this.view, "complete", this.onComplete);
            this.view.start(this.data);
        },
        onComplete: function () {
            this.stopListening();
            delete this.region;
            delete this.view;
            this.complete();
        }
    });
    var UserInputCommand = commands.Command.extend({
        initialize: function (options) {
            this.eventHub = options.eventHub;
            this.ui = this.eventHub.request("ui");
            this.model = options.model;
        },
        execute: function () {
            this.ui.inputResponse.removeClass("display-none");
            this.ui.btnCorrect.on("click", this.onClicked.bind(this)).removeClass("disabled");
            this.ui.btnWrong.on("click", this.onClicked.bind(this)).removeClass("disabled");
        },
        onClicked: function (e) {
            this.ui.btnCorrect.off("click");
            this.ui.btnWrong.off("click");
            var isCorrect = $(e.currentTarget).hasClass("equal") ? true : false;
            var isSameCareter = this.model.get("value") == this.model.get("lable");
            new FeedbackBox().show(isCorrect == isSameCareter);
            this.eventHub.execute("saveResponse", isCorrect);
            this.eventHub.execute("updateProgress");
            setTimeout(this.onComplete.bind(this), 1500);
        },
        onComplete: function () {
            this.ui.btnCorrect.unbind();
            this.ui.btnWrong.unbind();
            this.ui.btnCorrect.addClass("disabled");
            this.ui.btnWrong.addClass("disabled");
            delete this.ui;
            this.complete();
        }
    });
});
//# sourceMappingURL=f2.exersice.show.js.map;
 /***************************/ 
App.module("Pages.F2", function (F2, App, _Backbone, Marionette, $, _) {
    F2.Controller = {
        createExerscisePage: function (region) {
            var that = this;
            var configuration = App.request("configuration:exercise:niveau");
            configuration.blinkSpeed = App.userDefinedExerciseSetting;
            if (App.currentLevel == 3 || App.currentLevel == 6 || App.currentLevel == 9) {
                App.execute("entities:f2-list-data", function (data) {
                    that._createPage(data, configuration, region);
                });
            }
            else {
                var data = App.request("exercise:data");
                that._createPage(data, configuration, region);
            }
        },
        _createPage: function (data, configuration, region) {
            var objectives = new _Backbone.Collection(data);
            var model = new _Backbone.Model(configuration);
            if (App.currentLevel == 3 || App.currentLevel == 6 || App.currentLevel == 9) {
                view = new F2.Exercise.PageContinousBlink({ collection: objectives, model: model });
            }
            else {
                view = new F2.Exercise.Page({ collection: objectives, model: model });
            }
            region.show(view);
        }
    };
});
//# sourceMappingURL=f2.controller.js.map;
 /***************************/ 
App.module("Pages.F3.Exercise", function (Exercise, App, _Backbone, Marionette, $, _) {
    Exercise.Page = Marionette.Layout.extend({
        className: "f3",
        template: "pages/f3/exercise/show/f3.page",
        regions: {
            taskRegion: ".taskRegion",
            keyboardRegion: ".keyboardRegion"
        },
        ui: {
            lblBlinkSpeed: ".lblBlinkSpeed",
            lblProgress: ".lblProgress",
            lblTotal: ".lblTotal",
            lblBlinkText: ".lblBlinkText",
            lblInputText: ".lblInputText",
            lblModule: ".lblModule",
            lblNiveau: ".lblNiveau",
            lblAttempt: ".lblAttempt"
        },
        pageProgress: 1,
        userResponses: [],
        initialize: function () {
            this.userResponses = [];
            App.reqres.setHandler("exercise:save-response", this.saveResponse, this);
            this.listenTo(App.vent, "exercise:progress:updated", this.updateProgress, this);
        },
        onShow: function () {
            var that = this;
            this.updateInterfaceText();
            this.messageBox = new MessageBox(".messageBox");
            this.keyboard = App.request("create:keyboard", [{ type: "submit", value: "START", event: "submit" }]);
            this.listenTo(this.keyboard, "submit", this.onSubmitClicked, this);
            this.keyboardRegion.show(this.keyboard);
            this.createSeequence();
            $(".key").removeClass("dark").addClass("success");
            window.TestCollection = this.collection;
            window.UserResponses = this.userResponse;
        },
        onSubmitClicked: function () {
            this.$el.find(".keyboad").css({ visibility: "hidden" });
            this.$el.find(".messageBox").css({ opacity: 0 });
        },
        onClose: function () {
            App.reqres.removeHandler("exercise:save-response");
        },
        createSeequence: function () {
            var that = this;
            var sequence = new commands.SerialCommand();
            sequence.on("command:complete", this.onSequenceComplete, this);
            this.collection.each(function (data, i) {
                //console.log("createSeequence data " + JSON.stringify(data) + " ,i" + i);
                var blinkCommand = that.createBlinkCommand(data, i == 0);
                var touchInputCommand = that.createTouchInputCommand(data);
                sequence.addCommand(blinkCommand);
                sequence.addCommand(touchInputCommand);
            });
            sequence.execute();
        },
        createBlinkCommand: function (data, waitForUserInput) {
            console.log("f3 - creating blink command", waitForUserInput);
            var args = {
                model: this.model,
                data: data.attributes,
                region: this.taskRegion,
                keyboard: this.keyboard,
                messageBox: this.messageBox
            };
            if (waitForUserInput)
                return new BlinkCommandF3(args);
            else
                return new BlinkCommandNoWaitForUserInputAndNoKeyboard(args);
        },
        createTouchInputCommand: function (data) {
            return new TouchInputCommand({
                reqres: App.reqres,
                vent: App.vent,
                data: data.attributes,
                region: this.taskRegion,
                keyboard: this.keyboard,
                messageBox: this.messageBox
            });
        },
        revealeMessageBox: function () {
            //setTimeout(function(){$(".messageBox>.message02").removeClass("display-none")}, 1000)
        },
        saveResponse: function (userResponse) {
            var currentItem = this.collection.at(this.pageProgress - 1);
            var correctValue = currentItem.get("value");
            var numExpectedCorrectResponses = 0;
            var numCorrectResponses = 0;
            var numInCorrectResponses = 0;
            _.each(currentItem.get("items"), function (object) {
                if (object.value == correctValue)
                    numExpectedCorrectResponses++;
            });
            _.each(userResponse, function (object) {
                if (object.value == correctValue)
                    numCorrectResponses++;
                else
                    numInCorrectResponses++;
            });
            this.userResponses.push(userResponse);
            return ((numCorrectResponses - numInCorrectResponses) == numExpectedCorrectResponses);
        },
        updateInterfaceText: function () {
            this.ui.lblBlinkSpeed.text(+this.model.get("blinkSpeed") / 1000);
            this.ui.lblProgress.text(1);
            this.ui.lblTotal.text(this.collection.length);
            this.ui.lblModule.text(App.currentModule.match(/\d/)[0]);
            this.ui.lblNiveau.text(App.currentLevel);
            this.ui.lblAttempt.text(App.currentAttempt);
        },
        updateProgress: function () {
            this.pageProgress++;
            if (this.pageProgress <= this.collection.length)
                this.ui.lblProgress.text(this.pageProgress);
        },
        onSequenceComplete: function () {
            console.log('SequenceComplete');
            console.log('------------------');
            this.keyboard.setState(this.keyboard.states.DISABLED);
            var that = this;
            var countCorrect = 0;
            var countErrors = 0;
            var wordCount = this.collection.length;
            this.collection.each(function (model, i) {
                var objective = model;
                var correctValue = objective.get("value");
                var error = false;
                _.each(that.userResponses[i], function (response) {
                    if (response.value !== correctValue)
                        error = true;
                });
                if (error)
                    countErrors++;
            });
            console.log("errors", countErrors);
            console.log("wordCount", wordCount);
            console.log("correctCount", countCorrect);
            var appData = App.getCurrentExerciseData();
            appData.wordCount = wordCount;
            appData.correctCount = (wordCount - countErrors < 0) ? 0 : (wordCount - countErrors);
            appData.wrongCount = countErrors;
            appData.blinkSpeed = parseInt(this.model.get("blinkSpeed")) / 1000;
            appData.objectivesCount = wordCount;
            appData.isComplete = App.request("exerciseCompleationStatus", appData, "f3");
            App.execute("entities:data:save");
            setTimeout(function () {
                _Backbone.history.navigate(App.getCreateConfigurationPageQuery(), true);
            }, 200);
        }
    });
});
//# sourceMappingURL=f3.show.js.map;
 /***************************/ 
App.module("Pages.F3", function (F3, App, _Backbone, Marionette, $, _) {
    F3.Controller = {
        createExerscisePage: function (region) {
            var configuration = App.request("configuration:exercise:niveau");
            configuration.blinkSpeed = App.userDefinedExerciseSetting;
            var data = App.request("exercise:data");
            var objectives = new _Backbone.Collection(data);
            var model = new _Backbone.Model(configuration);
            var view = new F3.Exercise.Page({ collection: objectives, model: model });
            region.show(view);
        }
    };
});
//# sourceMappingURL=f3.controller.js.map;
 /***************************/ 
App.module("Pages.F4.Exercise", function (Exercise, App, _Backbone, Marionette, $, _) {
    Exercise.Page = Marionette.Layout.extend({
        className: "f4",
        template: "pages/f4/exercise/show/f4.exersice.page",
        regions: {
            exerciseRegion: ".exerciseRegion"
        },
        ui: {
            lblWPM: ".lblWPM",
            lblProgress: ".lblProgress",
            lblModule: ".lblModule",
            lblNiveau: ".lblNiveau",
            lblAttempt: ".lblAttempt",
        },
        fastButtonEvents: {
            "click .btn-yes": "onBtnSkimYesClicked",
            "click .btn-no": "onBtnSkimNoClicked"
        },
        addSkimToSeequence: true,
        onShow: function () {
            $("body").addClass("dim");
            $(".btnSkip").hide();
            this.seequence = new commands.SerialCommand();
            this.listenTo(App.vent, "exercise:progress:updated", this.updateProgress, this);
            this.listenTo(App.vent, "quiz:submit", this.saveResult, this);
            this.listenTo(App.vent, "exercise:update:interface", this.updateInterfaceOnAppEvent, this);
            this.listenTo(App.vent, "readcommand-gui-event", this.onReadCommandGuiEvent, this);
            this.listenTo(App.vent, "skip:skim", this.skipSkim, this);
            this.listenTo(this.seequence, "subcommand:complete", this.updateRoadMap, this);
            this.updateInterface();
            this.setUpComponents();
            this.updateRoadMap();
        },
        onReadCommandGuiEvent: function (data) {
            var el = $(".btnSkip");
            if (data.isSkimButtonVisible && !config.will_modules_be_locked_untill_progress) {
                el.show();
            }
            else {
                el.hide();
            }
        },
        onBtnSkimYesClicked: function () {
            this.addSkimToSeequence = true;
            this.setUpComponents();
            this.updateRoadMap();
        },
        onBtnSkimNoClicked: function () {
            this.addSkimToSeequence = false;
            this.setUpComponents();
            this.updateRoadMap();
        },
        setUpComponents: function () {
            this.createSequence();
            this.updateInterface();
            this.seequence.execute();
        },
        createSequence: function () {
            var skim = new ReadCommand({
                region: this.exerciseRegion,
                model: this.model,
                dubbleSpeed: true,
                vent: App.vent
            });
            var quizPreview = new QuizCommand({
                region: this.exerciseRegion,
                model: this.model,
                readonly: true,
                vent: App.vent
            });
            var read = new ReadCommand({
                region: this.exerciseRegion,
                model: this.model,
                dubbleSpeed: false,
                vent: App.vent
            });
            var quiz = new QuizCommand({
                region: this.exerciseRegion,
                model: this.model,
                readonly: false,
                vent: App.vent
            });
            if (this.addSkimToSeequence)
                this.seequence.addCommand(skim);
            this.seequence.addCommand(quizPreview);
            this.seequence.addCommand(read);
            this.seequence.addCommand(quiz);
            window.seequence = this.seequence;
        },
        skipSkim: function () {
            this.seequence.skipCurrentCommand();
        },
        onClose: function () {
            $("body").removeClass("dim");
        },
        updateInterfaceOnAppEvent: function (wpm) {
            this.ui.lblWPM.text(wpm);
        },
        updateInterface: function () {
            this.ui.lblWPM.text(this.model.get("wpm"));
            this.ui.lblModule.text(App.currentModule.match(/\d/)[0]);
            this.ui.lblNiveau.text(App.currentLevel);
            this.ui.lblAttempt.text(App.currentAttempt);
        },
        updateProgress: function (precent) {
            this.ui.lblProgress.text(precent);
        },
        saveResult: function (result) {
            var data = {
                fileName: this.model.get("fileName"),
                wordCount: this.model.get("correctResponses").length,
                wrongCount: _.without(result, true).length,
                blinkSpeed: this.model.get("wpm"),
                correctCount: _.without(result, false).length
            };
            var appData = App.getCurrentExerciseData();
            appData.wordCount = data.wordCount;
            appData.objectivesCount = data.wordCount;
            appData.wrongCount = data.wrongCount;
            appData.correctCount = data.correctCount;
            appData.blinkSpeed = data.blinkSpeed;
            appData.isComplete = App.request("exerciseCompleationStatus", appData, "f4");
            if (appData.isComplete) {
                App.userdata.f4WPM = appData.blinkSpeed;
                App.vent.trigger("update:user:profile");
            }
            App.execute("entities:data:save");
            setTimeout(function () {
                _Backbone.history.navigate(App.getCreateConfigurationPageQuery(), true);
            }, 200);
        },
        updateRoadMap: function () {
            var current = $(".roadmap div.current-position");
            if (!current.length) {
                $(".roadmap .not-current-position:first").addClass("current-position").removeClass("not-current-position");
            }
            else {
                current.next().removeClass("not-current-position").addClass("current-position");
                current.removeClass("current-position").addClass("not-current-position");
            }
        }
    });
    var ScrollView = Marionette.ItemView.extend({
        template: "pages/f4/exercise/show/f4.exersice.scroll.view",
        templateHelpers: {
            getText: function () {
                return this.text;
            }
        },
        ui: {
            "viewContainer": ".viewContainer",
            "accessibilityOverlayer": ".accessibilityOverlayer",
            "text": ".view"
        },
        onShow: function () {
            this.populateAccessibilityOverlayer();
            //Hyphenator.run();
        },
        populateAccessibilityOverlayer: function () {
            var strippedData = this.model.get("text")
                .replace(/<[^>]+(\/)?>/g, "") // remove all tags
                .replace(/[\n\r\t]+/g); // remove all line breaks
            this.ui.accessibilityOverlayer.html(strippedData);
        },
        start: function () {
            var wpm = this.model.get("wpm");
            var height = this.ui.viewContainer.get(0).scrollHeight - this.ui.text.position().top;
            var duration = this.getReadTimeInSeconds(wpm, this.countWords(this.ui.text.text()));
            console.log("start");
            this.myMove(height, duration);
            //this.ui.text.bind('webkitTransitionEnd transitionend otransitionend MSTransitionEnd', this.onComplete.bind(this));
            //this.createAnimation(this.ui.text, duation, height);
        },
        myMove: function (height, duration) {
            var elem = document.getElementById("hyphenate");
            var pos = 172;
            var adjustmentLengthPixelsForReadingSpeed = 170;
            var pixelsToMoveBeforeAllTextHaveBeenShown = height - adjustmentLengthPixelsForReadingSpeed;
            //const pixPrSec = pixelsToMoveBeforeAllTextHaveBeenShown/duration;
            var secPrPix = duration / pixelsToMoveBeforeAllTextHaveBeenShown;
            if (secPrPix * 1000 > 80) {
                var id_1 = setInterval(frame2, secPrPix * 500);
                var self_1 = this;
                function frame2() {
                    if (pos < -height) {
                        clearInterval(id_1);
                        self_1.trigger("scrollingtext:complete");
                    }
                    else {
                        //console.log("frameupdate, px: " + elem.style.top);
                        pos -= 0.5;
                        elem.style.top = pos + 'px';
                    }
                }
            }
            else {
                var id_2 = setInterval(frame, secPrPix * 1000);
                var self_2 = this;
                function frame() {
                    if (pos < -height) {
                        clearInterval(id_2);
                        self_2.trigger("scrollingtext:complete");
                    }
                    else {
                        //console.log("frameupdate, px: " + elem.style.top);
                        pos--;
                        elem.style.top = pos + 'px';
                    }
                }
            }
            /*
             const pixPr1Over60Sec = (pixelsToMoveBeforeAllTextHaveBeenShown/duration)/60;
             let id = setInterval(frame, 1000/60);
             console.log("myMove");
             let self = this;

             function frame() {

             if (pos < -height) {
             console.log("clearInterval h:" + height + ", d: " + duration);
             clearInterval(id);
             self.trigger("scrollingtext:complete")
             }
             else {
             //console.log("frameupdate, px: " + elem.style.top);
             pos -= pixPr1Over60Sec;
             elem.style.top = pos + 'px';
             //elem.position().top = pos + 'px';
             //elem.style.left = pos + 'px';
             }
             }
            * */
        },
        onComplete: function (e) {
            //this.ui.text.unbind('webkitTransitionEnd transitionend otransitionend MSTransitionEnd');
            this.trigger("scrollingtext:complete");
        },
        countWords: function (value) {
            if (value) {
                return value.replace(/\<.*?\>|\\r|\\n|\\t/g, "").match(/[^\s]+/g).length;
            }
            return 1;
        },
        getReadTimeInSeconds: function (wpm, numWords) {
            return 60 / wpm * numWords;
        },
        createAnimation: function ($el, duation, height) {
            var value = "top [@duation]s linear".replace(/\[@duation\]/g, duation);
            $el.css({
                top: -height,
                "-webkit-transition": value,
                "-moz-transition": value,
                "-ms-transition": value,
                "-o-transition": value,
                "transition": value
            });
        }
    });
    var CountDownAndTextScrollView = Marionette.Layout.extend({
        template: "pages/f4/exercise/show/f4.countdownandtextscroll",
        regions: {
            textScrollerRegion: ".textScrollerRegion"
        },
        events: {
            "click .btnStart": "startCountDown",
            "click .btnSkip": "skipThisExercise"
        },
        ui: {
            btnStart: ".btnStart",
            btnSkip: ".btnSkip",
            lblInformation: ".information",
        },
        initialize: function (object) {
            this.vent = object.vent;
        },
        onClose: function () {
            clearInterval(this.progressInterval);
        },
        hideInfoAndStartButton: function (args) {
            this.ui.lblInformation.animate({ opacity: 0 });
            TweenMax.to(this.ui.btnSkip, 0.5, { autoAlpha: 0 });
            TweenMax.to(this.ui.btnStart, 0.5, { autoAlpha: 0 });
        },
        startCountDown: function () {
            this.hideInfoAndStartButton();
            var countdownView = new App.Taskviews.Countdownview.View();
            this.listenTo(countdownView, "countdown:complete", this.onCountDownComplete, this);
            this.textScrollerRegion.show(countdownView);
            countdownView.start();
        },
        onCountDownComplete: function () {
            this.startScrollingText();
        },
        startScrollingText: function () {
            var scrollingView = new ScrollView({
                model: this.model
            });
            this.textScrollerRegion.show(scrollingView);
            this.listenTo(scrollingView, "scrollingtext:complete", this.onScrollintTextComplete, this);
            scrollingView.start();
            //this.progressInterval = setInterval(this.updateProgress.bind(this), 500);
        },
        updateProgress: function () {
            console.log("updateProgress");
            /*
             var value = Math.abs($(".view").position().top) / $(".view").height() * 100 >> 0;
             if (value >= 100) {
             clearInterval(this.progressInterval);
             value = 100;
             }
             App.vent.trigger("exercise:progress:updated", value);
             */
        },
        onScrollintTextComplete: function () {
            $(".textScrollerRegion").css({
                border: "none",
                height: "auto"
            });
            clearInterval(this.progressInterval);
            this.trigger("exercise:complete");
        },
        skipThisExercise: function () {
            this.vent.trigger("skip:skim");
        }
    });
    var ReadCommand = commands.Command.extend({
        initialize: function (options) {
            this.region = options.region;
            this.model = options.model.clone();
            this.dubbleSpeed = options.dubbleSpeed;
            this.model.set("dubbleSpeed", this.dubbleSpeed);
            this.vent = options.vent;
            if (this.dubbleSpeed) {
                this.model.set("wpm", parseInt(this.model.get("wpm")) * 2);
            }
        },
        execute: function () {
            this.vent.trigger("exercise:update:interface", this.model.get("wpm"));
            var task = new CountDownAndTextScrollView({ model: this.model, vent: this.vent });
            this.region.show(task);
            this.listenTo(task, "exercise:complete", this.onComplete, this);
            this.updateGui();
        },
        updateGui: function () {
            if (this.dubbleSpeed)
                this.vent.trigger("readcommand-gui-event", { isSkimButtonVisible: true });
            else
                this.vent.trigger("readcommand-gui-event", { isSkimButtonVisible: false });
        },
        onComplete: function () {
            this.complete();
        }
    });
});
//# sourceMappingURL=f4.exercise.show.js.map;
 /***************************/ 
App.module("Pages.F4", function (F4, App, _Backbone, Marionette, $, _) {
    F4.Controller = {
        createExerscisePage: function (region) {
            var streamedText;
            if (App.userdata._dataset && App.userdata._dataset.f4s) {
                console.log("App.currentModule " + App.currentModule);
                console.log("App.currentLevel " + App.currentLevel);
                console.log("App.currentAttempt " + App.currentAttempt);
                var indexF4 = (App.currentLevel - 1) * 4 + (App.currentAttempt - 1);
                streamedText = App.userdata._dataset.f4s[indexF4];
                console.log("App.userdata._dataset.f4s " + indexF4);
            }
            else {
                console.log("f4s use local");
            }
            var configuration = {
                filePath: App.request("exercise:data:p4"),
                wpm: App.userDefinedExerciseSetting
            };
            ///console.log("fstreamedText 1: " + streamedText);
            ///console.log("fstreamedText 2: " + JSON.stringify((streamedText)));
            if (streamedText) {
                configuration.filePath = "assets/json/txt-0.json";
                var data = streamedText;
                data.wpm = configuration.wpm;
                _.extend(configuration, data);
                var objectives = new _Backbone.Collection(data);
                var model = new _Backbone.Model(configuration);
                var view = new F4.Exercise.Page({ collection: objectives, model: model });
                region.show(view);
            }
            else {
                $.getJSON(configuration.filePath + "?cb=" + (+new Date())).fail(function () {
                    console.error(configuration.filePath + " " + App.translate("updatetheapp"));
                    alert(App.translate("updatetheapp"));
                });
                App.request("entities:dataAccess:loadDocument", configuration.filePath).done(function (data) {
                    data.wpm = configuration.wpm;
                    console.log("Setup f4 " + configuration.wpm);
                    _.extend(configuration, data);
                    var objectives = new _Backbone.Collection(data);
                    var model = new _Backbone.Model(configuration);
                    var view = new F4.Exercise.Page({ collection: objectives, model: model });
                    region.show(view);
                });
            }
        }
    };
});
//# sourceMappingURL=f4.controller.js.map;
 /***************************/ 
App.module("Pages.Home", function (Home, App, _Backbone, Marionette, $, _) {
    function ApplyFlowRuelsToFrontPage() {
        var exercises = [];
        var forceOpen = !config.will_modules_be_locked_untill_progress;
        extractModuleData();
        setStateOnModules();
        setStateDiplomaIfAllExercisesIsComplete();
        function extractModuleData() {
            console.log("\t Extract module data");
            // Grap the query from all boxes on the front page.
            $(".box").each(function () {
                var $el = $(this);
                var query = $el.data("query");
                var params = zoo.strings.toObject(query);
                var isComplete = App.request("entities:isLevelComplete", params.module, params.level);
                var isCompleteF4 = _.where(App.request("entities:data:query", query + ", exercise:f4").attempts, { isComplete: true }).length == 4;
                var data = {
                    $el: $el,
                    queryString: query,
                    queryObject: params,
                    isComplete: isComplete,
                    isCompleteF4: isCompleteF4,
                    index: exercises.length
                };
                exercises.push(data);
            });
        }
        function setStateOnModules() {
            console.log("\t Set state on modules");
            _.each(exercises, function (data) {
                if (data.isComplete) {
                    data.$el.addClass("done").removeClass("locked");
                }
                else if (previousComplete(data)) {
                    data.$el.removeClass("locked");
                }
                else if (forceOpen) {
                    data.$el.removeClass("locked");
                }
                else {
                    data.$el.removeClass("done").addClass("locked");
                }
                ///Opens the start test
                if (data.queryObject.module == "t1") {
                    data.$el.removeClass("locked");
                }
                ///Cleanup checkmarks
                if (!data.isComplete) {
                    data.$el.removeClass("done");
                }
            });
        }
        function previousComplete(data) {
            //console.log("\tpreviousComplete" + JSON.stringify(data));
            var previousIndex = data.index - 1;
            if (previousIndex >= 0) {
                return exercises[previousIndex].isComplete || exercises[previousIndex].isCompleteF4;
            }
            else {
                return false;
            }
        }
        function setStateDiplomaIfAllExercisesIsComplete() {
            var isComplete = App.request("entities:exercises:isAllComplete");
            if (isComplete || forceOpen) {
                $(".diplom-box").removeClass("locked");
                $("#diplom-box-title").removeClass("locked");
            }
            else {
                $(".diplom-box").addClass("locked");
                $("#diplom-box-title").addClass("locked");
            }
        }
    }
    Home.ApplyFlowRuelsToFrontPage = ApplyFlowRuelsToFrontPage;
});
//# sourceMappingURL=home.flow.js.map;
 /***************************/ 
App.module("Pages.Home", function (Home, App, _Backbone, Marionette, $, _) {
    Home.HomePage = FlowPage.extend({
        className: "homePageScrollWrapper",
        template: "pages/home/home.page",
        fastButtonEvents: {
            "click .box.test:not(.disabled)": "onTestClicked",
            "click .box.workbox:not(.disabled)": "onWorkSpaceClicked",
            "click .diplom-box:not(.disabled)": "onDiplomClicked"
        },
        initialize: function () {
            this.listenTo(App.vent, "changeInUserData", this.setCompleteState, this);
        },
        onTestClicked: function (e) {
            var query = zoo.strings.toObject($(e.target).data("query"));
            App.currentModule = query.module;
            App.currentLevel = parseInt(query.level);
            App.currentExercise = query.exercise;
            if (App.request("entities:isLevelComplete", App.currentModule)) {
                _Backbone.history.navigate("#result/{0}/1/{0}".format(App.currentModule), true);
            }
            else {
                this.setCurrentPositionInRoadMap(query);
                _Backbone.history.navigate("#test/" + App.getQuerryString(), true);
            }
        },
        onWorkSpaceClicked: function (e) {
            var query = zoo.strings.toObject($(e.target).data("query"));
            App.currentModule = query.module;
            App.currentLevel = parseInt(query.level);
            App.currentExercise = query.exercise;
            this.setCurrentPositionInRoadMap(query);
            $(e.target).css({ visibility: "hidden" });
            _Backbone.history.navigate("#workspace/" + App.getQuerryString(), true);
        },
        onDiplomClicked: function () {
            App.userdata.current_location_in_roadmap = App.roadmap.length - 1;
            _Backbone.history.navigate("#diploma", true);
        },
        setCurrentPositionInRoadMap: function (query) {
            var roadMapID = query.module.indexOf("t") > -1 ? query.module : query.module + "-" + query.level;
            App.userdata.current_location_in_roadmap = App.roadmap.indexOf(roadMapID);
        },
        onShow: function () {
            this.setCompleteState();
            TweenMax.to($(".box"), 0, { scale: 0, alpha: 0 });
            TweenMax.to($(".diplom-box"), 0, { scale: 0, alpha: 0 });
            setTimeout(this.onShowComplete.bind(this), 100);
            if (App.askForGroupId) {
                App.vent.trigger("show:group-code-menu");
            }
            else {
                App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(1);
            }
            $("#profileMenuRegion").removeClass("display-none");
        },
        setCompleteState: function () {
            Home.ApplyFlowRuelsToFrontPage();
        },
        transitionIn: function () {
            TweenMax.fromTo($(".module-border"), 0.5, { display: "block", autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5 });
            TweenMax.fromTo($(".module-title"), 0.2, { display: "block", autoAlpha: 0 }, { autoAlpha: 1, delay: 0.5 });
            TweenMax.to($(".box.test"), 0.5, { force3D: true, rotation: -2, delay: 0.2 });
            TweenMax.to($(".box"), 0.5, {
                force3D: true,
                scale: 1,
                alpha: 0.5,
                onComplete: this.transitionInComplete.bind(this)
            });
            TweenMax.to($(".diplom-box"), 0.5, { force3D: true, scale: 1, alpha: 0.5 });
            TweenMax.to($(".box:not(.disabled)"), 0.5, { alpha: 1 });
            TweenMax.to($(".diplom-box:not(.disabled)"), 0.5, { alpha: 1 });
        },
        onTransitionInComplete: function () {
            if (App.askForGroupId) {
                console.log("onTransitionInComplete Asking for group id");
                App.vent.trigger("show:group-code-menu");
                this.listenTo(App.vent, "changeInUserData", this.scrollToRoadMapLocation, this);
            }
            else {
                this.scrollToRoadMapLocation();
                App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(1);
            }
        },
        transitionOut: function () {
            this.$el.hide();
            this.transitionOutComplete();
        },
        scrollToRoadMapLocation: function () {
            var index = App.userdata.current_location_in_roadmap;
            var selector = App.roadmap[index];
            var $el = $("#" + selector);
            var position = 0;
            while (!$el.hasClass("home-container")) {
                position += ($el.position().left + parseInt($el.css("margin-left")));
                $el = $el.parent();
            }
            var homePageScrollWrapper = $(".homePageScrollWrapper");
            var currentPosition = homePageScrollWrapper.scrollLeft();
            var newPosition = position + currentPosition;
            homePageScrollWrapper.animate({ "scrollLeft": newPosition });
            if (App.askForGroupId) {
            }
            else {
                App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(1);
            }
        }
    });
});
//# sourceMappingURL=home.js.map;
 /***************************/ 
App.module("Pages.Login", function (Login, App, _Backbone, Marionette, $, _) {
    var LoginPage = FlowPage.extend({
        template: "pages/login/show/login.page",
        regions: {
            loginForm: ".loginform",
            noConnectionRegion: ".noConnectionRegion",
            messageRegion: ".messageRegion",
            languageSelection: ".languageSelection"
        },
        templateHelpers: {
            version: App.version
        },
        isAuthenticating: false,
        initialize: function () {
            console.log("Login page initialized");
            this.listenTo(App.vent, "changestate:unic", this.onChangeToUnicLogin, this);
            this.listenTo(App.vent, "changestate:frontread", this.onChangeToFrontreadLogin, this);
            this.listenTo(App.vent, "authenticate", this.onAuthenticate, this);
            this.listenTo(App.vent, "device-network-status-changed", this.onNetworkStatusChanged, this);
            this.listenTo(App.vent, "form:message", this.onFormMessage, this);
        },
        onShow: function () {
            /// When using the unic-web login we leave the domain to use the unic login,
            /// then we will get redirected back if the login was successful,
            /// but if an error occur we will need to display the unic login formula.
            if (getUrlParams().hasOwnProperty("auth")) {
                this.onChangeToUnicLogin();
                var unicWebAuthentication = UserData.getUnicWebAuthentication();
                if (unicWebAuthentication == null) {
                    unicWebAuthentication = { status: "400", statusText: "No errors recorded from UNI-Login request. Did you use an old link?" };
                }
                var status_1 = parseInt(unicWebAuthentication.status);
                var statusText = unicWebAuthentication.statusText;
                this.displayErrorMessage(isNaN(status_1) ? -1 : status_1, statusText);
                $(".txtGroupName").val(UserData.getGroup());
            }
            else {
                ///Initing
                App.ServerUrl();
                ///Standard Default login view
                if (config.language == "dan") {
                    this.onChangeToUnicLogin();
                }
                else {
                    this.onChangeToFrontreadLogin();
                }
            }
            this.onNetworkStatusChanged();
            this.startOnlineMonitor(10);
            var uiLanguage = new UiLanguage();
            this.languageSelection.show(uiLanguage);
        },
        startOnlineMonitor: function (delay) {
            var self = this;
            setTimeout(function () {
                self.checkOnlineState().done(function (isOnline) {
                    if (isOnline !== self.onlineStatus) {
                        self.onlineStatus = isOnline;
                        App.isOnline = isOnline;
                        App.vent.trigger("device-network-status-changed");
                    }
                    if (isOnline) {
                        self.startOnlineMonitor(10000);
                    }
                    else {
                        self.startOnlineMonitor(1000);
                    }
                });
            }, delay);
        },
        checkOnlineState: function () {
            var deferred = $.Deferred();
            $.ajax({
                type: "GET",
                url: App.ServerUrl() + "/ping/",
                done: function (data) {
                    deferred.resolve(true);
                },
                fail: function (data) {
                    deferred.resolve(false);
                }
            });
            return deferred;
        },
        onChangeToUnicLogin: function () {
            console.log("Changed to UNI-Login login");
            if (this.isAuthenticating)
                return;
            this.messageRegion.reset();
            UserData.setUserType("praxis");
            if (config.mobile_app)
                this.loginForm.show(new UnicMobileLoginForm());
            else
                this.loginForm.show(new UnicWebLoginForm());
        },
        onChangeToFrontreadLogin: function () {
            console.log("Changed to FrontRead login");
            if (this.isAuthenticating)
                return;
            this.messageRegion.reset();
            UserData.setUserType("frontread");
            this.loginForm.show(new FrontreadLoginForm());
        },
        stateButton: function (params, working) {
            if (!params.stateButton)
                return;
            if (working) {
                $(params.stateButton).find(".button-lable").hide();
                $(params.stateButton).find(".button-working").show();
            }
            else {
                $(params.stateButton).find(".button-lable").show();
                $(params.stateButton).find(".button-working").hide();
            }
        },
        onAuthenticate: function (params) {
            if (this.isAuthenticating)
                return;
            var self = this;
            this.messageRegion.reset();
            this.isAuthenticating = true;
            this.stateButton(params, true);
            Server.authenticate(params)
                .done(function () {
                self.stateButton(params, false);
            })
                .fail(function (data) {
                console.error("data pre: " + JSON.stringify(data));
                data.status = data.status ? data.status : data; //{status: 400};
                data.message = data.statusText ? data.statusText : data.message; //{status: 400};
                self.isAuthenticating = false;
                self.stateButton(params, false);
                self.displayErrorMessage(Number(data.status), data.message);
            });
        },
        displayErrorMessage: function (status, message) {
            console.log("pre:", status + ", " + message);
            console.log("usertype: " + UserData.getUserType());
            //decide error message popup content
            if (UserData.getUserType() == "praxis") {
                console.log("usertype praxis, status: " + status + " | message: " + message);
                //write message if null
                if (message == 'Forbidden' || typeof message == 'undefined') {
                    switch (status) {
                        case 0:
                            message = "Server Error";
                            break;
                        case 403:
                            message = "Manglende licens. Din skole har ikke licens til FrontRead. Kontakt FrontRead for mere information";
                            break;
                        case 404:
                            message = App.translate("invalidGroup");
                            break;
                        case 403:
                            message = App.translate("invalidLogin");
                            break;
                        case 500:
                        default:
                            message = App.translate("unknownError").format(status);
                            break;
                    }
                }
            }
            else {
                console.log("usertype other, status: " + status + " | message: " + message);
                if (typeof message == 'undefined' || message.indexOf("Not Found") > -1) {
                    switch (status) {
                        case 0:
                            message = "Server Error";
                            break;
                        case 404:
                            message = App.translate("invalidLogin");
                            break;
                        case 405:
                            break;
                        default:
                            message = App.translate("unknownError").format(status);
                            break;
                    }
                }
            }
            var start = "<h1 class='error'>";
            var end = "</h1>";
            var index = message.indexOf('!');
            if (index == -1) {
                message = App.translate("error").format(status) + " " + message;
                index = message.indexOf('!');
            }
            message = start + message.substr(0, index + 1) + end + message.substr(index + 1);
            console.error("could not login " + status + ", " + message);
            App.vent.trigger("form:message", message);
        },
        onUnicWebFailed: function (data) {
            alert("UNI-Login web failed");
        },
        onNetworkStatusChanged: function () {
            if (DataStore.API().isOnline()) {
                this.noConnectionRegion.reset();
            }
            else {
                this.noConnectionRegion.show(new NoInternetConnection());
            }
            var onlineStatus = { isOnline: App.isOnline };
            console.log("Network status: ", onlineStatus);
            $(".net-work-status").animate({ opacity: onlineStatus.isOnline ? 0 : 1 }, 150);
            this.lastOnlineStatus = onlineStatus;
        },
        onFormMessage: function (message) {
            console.log("showing form message");
            this.messageRegion.show(new FormMessage({
                model: new _Backbone.Model({ message: message })
            }));
        },
        transitionOut: function () {
            TweenMax.to(this.$el, 0.5, { autoAlpha: 0 });
            this.onTransitionOutComplete();
        }
    });
    Login.Page = LoginPage;
    var loginStateStored = "changestate:frontread";
    var FrontreadLoginForm = Marionette.ItemView.extend({
        template: "pages/login/show/login.frontread",
        templateHelpers: {
            version: App.version
        },
        ui: {
            txtUserName: ".txtUserName",
            txtPassword: ".txtPassword",
            btnChangeLogin: ".btnChangeLogin",
            installPWAbtn: ".installPWAbtn"
        },
        events: {
            "click .btnChangeLogin": "onChangeLoginClicked",
            "click .btnLogin": "onLoginClicked",
            "enter .btnLogin": "onLoginClicked",
            "click .installPWAbtn": "onInstallPWAbtn"
        },
        onShow: function () {
            if (App.showPwaInstallBtn() || App.showInstallBtnOnIos()) {
                this.ui.installPWAbtn.removeClass("display-none");
            }
            ;
            if (config.language == "dan") {
                this.ui.btnChangeLogin.removeClass("display-none");
            }
            else {
                this.ui.btnChangeLogin.addClass("display-none");
            }
        },
        onInstallPWAbtn: function () {
            if (!App.showInstallBtnOnIos()) {
                window.pwaPrompt.prompt();
            }
            else {
                // show animated gif with instructions
                $("#installinstructions").removeClass("display-none");
            }
        },
        onChangeLoginClicked: function () {
            loginStateStored = "changestate:unic";
            App.vent.trigger("changestate:unic");
        },
        onLoginClicked: function () {
            console.log("Login clicked");
            //launchIntoFullscreen(document.documentElement); // the whole page
            if (this.ui.txtUserName.val().length && this.ui.txtPassword.val().length)
                this.submit();
        },
        submit: function () {
            App.vent.trigger("authenticate", {
                username: this.ui.txtUserName.val(),
                password: this.ui.txtPassword.val(),
                stateButton: ".btnLogin"
            });
        }
    });
    // Find the right method, call on correct element
    function launchIntoFullscreen(element) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        }
        else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        }
        else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }
        else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }
    var UnicWebLoginForm = Marionette.ItemView.extend({
        templateHelpers: {
            version: App.version
        },
        template: "pages/login/show/login.unicweb",
        ui: {
            txtGroupName: ".txtGroupName",
            btnLogin: ".btnLogin",
            installPWAbtn: ".installPWAbtn"
        },
        events: {
            "click  .btnLogin": "onLoginClicked",
            "click  .btnChangeLogin": "onChangeLoginClicked",
            "change .txtGroupName": "onTextInputChanged",
            "keyup  .txtGroupName": "onTextInputChanged",
            "click .installPWAbtn": "onInstallPWAbtn"
        },
        onShow: function () {
            if (App.showPwaInstallBtn() || App.showInstallBtnOnIos()) {
                this.ui.installPWAbtn.removeClass("display-none");
            }
            ;
            /*
            if( !App.showInstallBtnOnIos()) {
                window.pwaPrompt.prompt();
            } else {
                // show animated gif with instructions
                $("#installinstructions").removeClass("display-none");
            }*/
        },
        onInstallPWAbtn: function () {
            if (!App.showInstallBtnOnIos()) {
                window.pwaPrompt.prompt();
            }
            else {
                // show animated gif with instructions
                $("#installinstructions").removeClass("display-none");
            }
        },
        onChangeLoginClicked: function () {
            loginStateStored = "changestate:frontread";
            App.vent.trigger("changestate:frontread");
        },
        onLoginClicked: function () {
            this.submit();
        },
        submit: function () {
            console.log("use to set txt groupname");
            console.warn("Authenticate With Unic Web");
            App.vent.trigger("authenticate", {});
        }
    });
    var UnicMobileLoginForm = Marionette.ItemView.extend({
        template: "pages/login/show/login.unicmobile",
        templateHelpers: {
            version: App.version
        },
        ui: {
            txtUserName: ".txtUserName",
            txtPassword: ".txtPassword",
            btnLogin: ".btnLogin"
        },
        events: {
            "click .btnChangeLogin": "onChangeLoginClicked",
            "click .btnLogin": "onLoginClicked",
            "keyup  .txtGroupName": "onValidate",
            "keyup  .txtPassword": "onValidate",
            "keyup  .txtUserName": "onValidate"
        },
        onShow: function () {
            this.onValidate();
        },
        onValidate: function (e) {
        },
        onChangeLoginClicked: function () {
            loginStateStored = "changestate:frontread";
            App.vent.trigger("changestate:frontread");
        },
        onLoginClicked: function () {
            this.submit();
        },
        submit: function () {
            UserData.setUnicID(this.ui.txtUserName.val());
            App.vent.trigger("authenticate", {
                username: this.ui.txtUserName.val(),
                password: this.ui.txtPassword.val(),
                stateButton: ".btnLogin"
            });
        }
    });
    var NoInternetConnection = Marionette.ItemView.extend({
        template: "pages/login/show/login.nointernet",
        className: "form-container no-connection-page",
        templateHelpers: {
            version: App.version
        }
    });
    var FormMessage = Marionette.ItemView.extend({
        template: "pages/login/show/login.message",
        templateHelpers: {
            version: App.version
        }
    });
    var UiLanguage = Marionette.ItemView.extend({
        template: "pages/login/show/login.uilanguage",
        className: "ui-language",
        id: "extended-ui-language",
        events: {
            "click .dan": "onDanClicked",
            "click .deu": "onDeuClicked",
            "click .eng": "onEngClicked",
            "click .nor": "onNorClicked",
            "select .dan": "onDanClicked",
            "select .deu": "onDeuClicked",
            "select .eng": "onEngClicked",
            "select .nor": "onNorClicked",
            "select dan": "onDanClicked",
            "select deu": "onDeuClicked",
            "select eng": "onEngClicked",
            "select nor": "onNorClicked"
        },
        onChange: function (iso3) {
            console.log("Language changed to " + iso3);
            config.language = iso3;
            App.vent.trigger(loginStateStored);
        },
        initialize: function () {
            if (config.show_flags) {
                setInterval(function () {
                    var choosen = $('#choosen');
                    if (choosen.attr('class').indexOf("choosen ") > -1) {
                        var iso3 = choosen.attr('class').replace("choosen ", "");
                        console.log("UiLanguage iso3 " + iso3);
                        if (iso3 && iso3 != "") {
                            config.language = iso3;
                            choosen.removeClass(iso3);
                            App.vent.trigger(loginStateStored);
                            console.log("IF iso3: " + iso3);
                        }
                    }
                }, 500);
            }
        },
        onBeforeRender: function () {
            console.log("Before render: Language config " + config.language);
            $('#tech').val(config.language);
            $('#ddlabel').val(config.language);
            console.log("login on beforeRender: " + App.showPwaInstallBtn());
        },
        onRender: function () {
            var windowInnerHeight = window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth;
            var head = $('head');
            if (windowInnerHeight > 640) {
                head.append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">');
            }
            else {
                head.append('<meta name="viewport" content="width=device-width, initial-scale=0.5, maximum-scale=0.5, user-scalable=0">');
            }
            head.find("link").attr("href", function (i, value) {
                return value + "?v=" + App.version;
            });
        },
        onDanClicked: function () {
            this.onChange("dan");
        },
        onDeuClicked: function () {
            this.onChange("deu");
        },
        onEngClicked: function () {
            this.onChange("eng");
        },
        onNorClicked: function () {
            this.onChange("nor");
        }
    });
});
//# sourceMappingURL=login.show.js.map;
 /***************************/ 
App.module("Pages", function (Home, App, _Backbone, Marionette, $, _) {
    var exercise_correct_precentage_requirements = [];
    exercise_correct_precentage_requirements["f1"] = 50; //var 60 før 2016-06-27
    exercise_correct_precentage_requirements["f2"] = 60;
    exercise_correct_precentage_requirements["f3"] = 60;
    exercise_correct_precentage_requirements["f4"] = 50; //var 10 før 2016-06-27
    exercise_correct_precentage_requirements["test"] = 60; //var 50 før 2019-12-06 //var 40 før 2016-06-27 //var 30 før 2016-04
    App.reqres.setHandler("getAttemptStatusClass", function (object, exerciseID) {
        var result = "";
        switch (object.isComplete) {
            case false:
                if (object.correctCount || object.wrongCount || object.objectivesCount) {
                    var correctPrecentage = object.correctCount / object.objectivesCount * 100;
                    result = (correctPrecentage >= exercise_correct_precentage_requirements[exerciseID]) ? "complete" : "failed";
                }
                else {
                    result = "not-attempted";
                }
                break;
            case true:
                result = "complete";
                break;
        }
        return result;
    });
    App.reqres.setHandler("exerciseCompleationStatus", function (object, exerciseID) {
        var correctPrecentage = object.correctCount / object.objectivesCount * 100;
        var isComplete = correctPrecentage >= exercise_correct_precentage_requirements[exerciseID];
        console.log("exercise completion status");
        console.log("-------------------------");
        console.log("\t correct answers:", object.correctCount);
        console.log("\t total answers:", object.objectivesCount);
        console.log("\t correct percentage:", correctPrecentage);
        console.log("\t exercise complete:", isComplete);
        return isComplete;
    });
});
//# sourceMappingURL=pages.controller.js.map;
 /***************************/ 
App.module("savedialog", function (savedialog, App, _Backbone, Marionette, $, _) {
    var View = Marionette.ItemView.extend({
        template: "pages/savedialog/savedialog.view",
        className: "save-dialog",
        ui: {
            statusSaving: ".satus-saving",
            statusSuccess: ".status-success",
            statusFailed: ".status-failed"
        },
        events: {
            "click .btn-retry": "saveData",
            "click .btn-continue": "closeDialog"
        },
        onShow: function () {
            this.statusSaving();
            this.saveData();
        },
        test: function () {
            console.warn("running test version of save.");
            var self = this;
            this.statusSaving();
            var deferred = $.Deferred();
            deferred.done(function () {
                self.statusSuccess();
            }).fail(function () {
                self.statusFailed();
            });
            setTimeout(function () {
                deferred.reject();
            }, 2000);
        },
        saveData: function () {
            var self = this;
            var deferred = DataStore.API().saveUserData(App.userdata);
            deferred.done(function (returnDataFromSave) {
                App.userdata = returnDataFromSave;
                self.statusSuccess();
                setTimeout(function () {
                    self.closeDialog();
                }, 300);
            }).fail(function () {
                self.statusFailed();
            });
        },
        statusSaving: function (deferred) {
            this.ui.statusSaving.show();
            this.ui.statusSuccess.hide();
            this.ui.statusFailed.hide();
        },
        statusSuccess: function (deferred) {
            this.ui.statusSaving.hide();
            this.ui.statusSuccess.show();
            this.ui.statusFailed.hide();
        },
        statusFailed: function (deferred) {
            this.ui.statusSaving.hide();
            this.ui.statusSuccess.hide();
            this.ui.statusFailed.show();
        },
        closeDialog: function () {
            App.vent.trigger("close:savedialog");
        }
    });
    var Controller = {
        show: function (data) {
            var model = new _Backbone.Model(data);
            var page = new View({ model: model });
            App.dialogRegion.show(page);
            $(App.dialogRegion.el).removeClass("display-none");
        },
        hide: function () {
            App.dialogRegion.reset();
            $(App.dialogRegion.el).addClass("display-none");
        }
    };
    App.vent.bind("show:savedialog", function (data) {
        Controller.show(data);
    });
    App.vent.bind("close:savedialog", function () {
        Controller.hide();
    });
});
//# sourceMappingURL=savedialog.view.js.map;
 /***************************/ 
App.module("Pages.Tests.ReadSpeed.Exercise", function (Exercise, App, _Backbone, Marionette, $, _) {
    Exercise.View = Marionette.Layout.extend({
        className: "t1",
        template: "pages/tests/readspeed/exercise/exercise.page",
        regions: {
            "contentRegion": ".content-area"
        },
        result: {
            skim: false,
            wpm: 0,
            wordcount: 0,
            wrongCount: 0,
            timeElapsed: 0,
            correctCount: 0,
            objectivesCount: 0
        },
        ui: {
            lable1: ".info-1 .lable",
            value1: ".info-1 .value",
            lable2: ".info-2 .lable",
            value2: ".info-2 .value"
        },
        templateHelpers: {
            getTitle: function () {
                switch (App.currentModule) {
                    case "t1":
                        return App.translate("starttest-single");
                    case "t2":
                        return App.translate("mellemtest-single") + " 1";
                    case "t3":
                        return App.translate("mellemtest-single") + " 2";
                    case "t4":
                        return App.translate("sluttest-single");
                }
            }
        },
        initialize: function (args) {
            this.seequence = new commands.SerialCommand();
            this.listenTo(App.vent, "quiz:submit", this.saveQuizResult, this);
            this.listenTo(App.vent, "read:complete", this.saveReadResult, this);
            this.listenTo(this.seequence, "command:complete", this.saveResult, this);
            this.listenTo(this.seequence, "subcommand:complete", this.updateRoadMap, this);
            this.listenTo(this.seequence, "after:execute", this.onBeforeExecute, this);
        },
        createInformation: function () {
            var moduleName = "";
            var middleTestDisplayNumber = "";
            switch (App.currentModule) {
                case "t2":
                    moduleName = App.translate("mellemtest-single");
                    middleTestDisplayNumber = "1";
                    break;
                case "t3":
                    moduleName = App.translate("mellemtest-single");
                    middleTestDisplayNumber = "2";
                    break;
                case "t4":
                    moduleName = App.translate("sluttest-single");
                    break;
            }
            this.ui.lable1.text(moduleName);
            this.ui.value1.text(" " + middleTestDisplayNumber);
        },
        createModel: function (data) {
            this.model = new _Backbone.Model(data);
            this.$el.find(".content-area").css({ opacity: 0 });
            this.showAndCreateSeequence();
        },
        showAndCreateSeequence: function (args) {
            this.createSeequence();
            this.$el.find(".content-area").animate({ opacity: 1 });
        },
        createSeequence: function () {
            console.log("skim default false");
            this.skim = false;
            var countDownCommand = this.createCountDownCommand();
            var quizPreviewCommand = this.createQuizPreviewCommand();
            var textReaderCommand = this.createTextReaderCommand();
            var quizCommand = this.createQuizCommand();
            var skimCommand = this.createSkimCommand();
            if (App.currentModule == "t2" || App.currentModule == "t3") {
                this.seequence.addCommand(skimCommand);
            }
            // new
            this.seequence.addCommand(quizPreviewCommand);
            this.seequence.addCommand(countDownCommand);
            this.seequence.addCommand(textReaderCommand);
            this.seequence.addCommand(quizCommand);
            this.seequence.execute();
            this.createInformation();
        },
        createCountDownCommand: function () {
            return new CountDownCommand({
                region: this.contentRegion
            });
        },
        createQuizPreviewCommand: function () {
            return new QuizCommand({
                id: "quiz",
                region: this.contentRegion,
                model: this.model,
                readonly: true,
                vent: App.vent
            });
        },
        createQuizCommand: function () {
            return new QuizCommand({
                id: "quiz",
                region: this.contentRegion,
                model: this.model,
                readonly: false,
                vent: App.vent
            });
        },
        createTextReaderCommand: function () {
            return new TextViewCommand({
                id: "textReader",
                model: this.model,
                region: this.contentRegion,
                ui: this.model.ui
            });
        },
        createSkimCommand: function () {
            return new SkimCommand({
                id: "skim",
                model: this.model,
                region: this.contentRegion
            });
        },
        saveReadResult: function (result) {
            _.extend(this.result, result);
        },
        saveQuizResult: function (result) {
            this.result.objectivesCount = this.model.get("correctResponses").length;
            this.result.wrongCount = _.without(result, true).length;
            this.result.correctCount = _.without(result, false).length;
            var userData = App.request("entities:data:query", App.request("entities:build:query", App.currentModule));
            var thisWpm = (this.result.wpm > 5000) ? 5000 : this.result.wpm;
            var testIndex;
            switch (App.currentModule) {
                case "t1":
                    testIndex = 0;
                    break;
                case "t2":
                    testIndex = 1;
                    break;
                case "t3":
                    testIndex = 2;
                    break;
                case "t4":
                    testIndex = 3;
                    break;
            }
            if (!userData.isComplete || (userData.isComplete && config.tests_can_be_retaken == true)) { //If it´s the first time, the test is completed, or if they are allowed to retake it
                userData.wpm = thisWpm;
                userData.wordcount = this.result.wordcount;
                userData.wrongCount = this.result.wrongCount;
                userData.timeElapsed = this.result.timeElapsed;
                userData.correctCount = this.result.correctCount;
                userData.objectivesCount = this.result.objectivesCount;
                userData.skim = this.result.skim;
                userData.isComplete = App.request("exerciseCompleationStatus", userData, "test");
                this.lockRetryTests();
            }
            else { //Else, push it to the retry array
                console.log("The test has already been passed; adding test to archive");
                if (App.userdata.tests[testIndex].retryPassed) {
                    ///no value stored in for retrying
                }
                else {
                    App.userdata.tests[testIndex].retryPassed = [];
                }
                App.userdata.tests[testIndex].retryPassed.push({ wpm: thisWpm, correctCount: this.result.correctCount });
            }
            userData.isComplete = App.request("exerciseCompleationStatus", userData, "test");
            if (userData.isComplete) {
                App.gaEvent("COMPLETED-" + App.currentExercise);
            }
        },
        lockRetryTests: function () {
            DataStore.lockRetryTests(function (err) {
                if (err) {
                    console.error("Could not lock Retry Tests");
                }
                else {
                    config.tests_can_be_retaken = false;
                    console.log("test locked in config");
                }
            });
        },
        saveResult: function () {
            App.execute("entities:data:save");
            this.gotoResultPage();
        },
        gotoResultPage: function () {
            var userData = App.request("entities:data:query", App.request("entities:build:query", App.currentModule));
            userData.isComplete = App.request("exerciseCompleationStatus", userData, "test");
            setTimeout(function () {
                _Backbone.history.navigate("#result/{0}/{1}/{2}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise), true);
                console.log("UserData: ");
                console.log(UserData);
                if (App.currentExercise != "t1" && userData.isComplete) {
                    App.vent.trigger("show:compare-speed-window");
                }
            }, 200);
        },
        updateRoadMap: function (command) {
            if (command instanceof CountDownCommand)
                return;
            var current = $(".roadmap div.current-position");
            current.next().removeClass("not-current-position").addClass("current-position");
            current.removeClass("current-position").addClass("not-current-position");
        },
        onBeforeExecute: function (command) {
            switch (command.id) {
                case "skim":
                    this.ui.lable2.text(App.translate("skimmehastighed-single") + " ");
                    this.ui.value2.text((App.userdata.f4WPM * 2 || 0) + " " + App.translate("opm"));
                    break;
                case "quiz":
                    this.ui.lable2.text("");
                    this.ui.value2.text("");
                    break;
                case "textReader":
                    this.ui.lable2.text("");
                    this.ui.value2.text("");
                    break;
            }
        },
    });
    var CountDownCommand = commands.Command.extend({
        initialize: function (options) {
            this.region = options.region;
        },
        execute: function () {
            var progressbarView = new App.Taskviews.Progressbarview.View();
            this.listenTo(progressbarView, "countdown:complete", this.onCountDownComplete, this);
            this.region.show(progressbarView);
            progressbarView.start();
        },
        onCountDownComplete: function () {
            this.onDestroy();
            this.complete();
        },
        onDestroy: function () {
            this.stopListening();
        }
    });
    var TextViewCommand = commands.Command.extend({
        initialize: function (options) {
            this.model = options.model;
            this.region = options.region;
        },
        execute: function () {
            this.createTextReadView();
        },
        createTextReadView: function () {
            var model = new _Backbone.Model({ text: this.model.get("text"), ui: this.ui });
            var view = new TextView({ model: model });
            this.region.show(view);
            this.listenTo(view, "exercise:complete", this.onComplete, this);
        },
        onComplete: function (result) {
            App.vent.trigger("read:complete", result);
            this.onDestroy();
            this.complete();
        },
        onDestroy: function () {
            this.stopListening();
        }
    });
    var SkimCommand = commands.Command.extend({
        initialize: function (options) {
            this.model = options.model;
            this.region = options.region;
        },
        execute: function () {
            this.createViews();
        },
        createViews: function () {
            var wpm = (App.userdata.f4WPM == 0) ? 350 : App.userdata.f4WPM;
            var model = new _Backbone.Model({ text: this.model.get("text"), wpm: wpm * 2 });
            var view = new CountDownAndTextScrollView({ model: model });
            this.region.show(view);
            this.listenTo(App.vent, "skip:skim", this.onComplete, this);
            this.listenTo(view, "exercise:complete", this.onComplete, this);
        },
        onComplete: function (result) {
            App.vent.trigger("read:complete", result);
            this.onDestroy();
            this.complete();
        },
        onDestroy: function () {
            this.stopListening();
        }
    });
    var TextView = Marionette.ItemView.extend({
        template: "pages/tests/readspeed/exercise/readview",
        text: "",
        index: 0,
        fastButtonEvents: {
            "click .btnFinish": "stopTheTimer",
            "click .btnConfirm": "onConfirmClicked",
            "click .btnCancel": "onCancelClicked"
        },
        ui: {
            confirmDialog: ".confirm-action-overlayer",
            btnFinish: ".btnFinish"
        },
        timeElapsed: 0,
        wordCount: 0,
        result: {},
        initialize: function () {
            this.text = this.model.get("text");
        },
        onRender: function () {
            this.countText(this.text);
            this.$el.find(".text-dummy").html(this.text);
        },
        onShow: function () {
            //Don't show the "too fast"-warning before .btnFinish is pressed
            this.ui.confirmDialog.hide();
            var wrapperWidth = $(".wrapper").width();
            console.log("wrapperWidth = " + wrapperWidth);
            var text_dummy_element = $("#text-dummy").find(".text-dummy");
            $(".text-dummy").append(text_dummy_element);
            this.startTimer();
            $(".wrapper").css({ "padding": "40px" }); //This forces the view to update and solves a bug in Google Chrome. Without this the text does not appear in the column
            $(".confirm-action-overlayer").css({ "min-width": wrapperWidth + "px" });
        },
        calculateContainerWidth: function () {
            var $culms = $(".column");
            var width = 0;
            $culms.each(function () {
                var $el = $(this);
                width +=
                    parseInt($el.css("margin-left")) +
                        parseInt($el.css("margin-right")) +
                        $el.width();
            });
            console.log("calculating width to:", width);
            return width;
        },
        countText: function (text) {
            try {
                this.wordCount = text.replace(/\<.*?\>|\\r|\\n|\\t/g, "").match(/[^\s]+/g).length;
            }
            catch (e) {
                this.wordCount = 1;
            }
        },
        stopTheTimer: function () {
            this.stopTimer();
            var ms = this.timeElapsed;
            var s = ms * 0.001;
            var wps = this.wordCount / s;
            var maxAllowedWPM = 800;
            var result = {
                wpm: Math.round(wps * 60),
                wordcount: this.wordCount,
                timeElapsed: (new Date()).clearTime().addSeconds(s).toString("mm:ss")
            };
            if (result.wpm <= maxAllowedWPM || config.reading_speed_can_be_over_maxAllowedWPM) {
                //console.log("result.timeElapsed: ", result.timeElapsed + "timeElapsed: ", this.timeElapsed);
                this.trigger("exercise:complete", result);
            }
            else {
                this.ui.confirmDialog.show();
            }
        },
        startTimer: function () {
            this.startTime = +new Date();
            this.deltaTimeStamps = [];
            this.deltaTimeStamps.push([0, this.startTime]);
        },
        stopTimer: function () {
            this.timeElapsed = +new Date() - this.startTime;
            this.deltaTimeStamps[this.deltaTimeStamps.length - 1][1] = +new Date() - this.deltaTimeStamps[this.deltaTimeStamps.length - 1][1];
            var pageSum = [];
            for (var i = 0; i < this.deltaTimeStamps.length; i++) {
                if (this.deltaTimeStamps[i][0] >= pageSum.length) {
                    pageSum.push(0);
                }
                pageSum[this.deltaTimeStamps[i][0]] += this.deltaTimeStamps[i][1];
            }
            var pagesumObject = {};
            for (var i = 0; i < pageSum.length; i++) {
                pagesumObject['page ' + i] = pageSum[i];
            }
        },
        onConfirmClicked: function () {
            var ms = this.timeElapsed;
            var s = ms * 0.001;
            var wps = this.wordCount / s;
            console.log("Current module: " + App.currentModule);
            console.log("Current WPM: " + Math.round(wps * 60));
            Backbone.history.loadUrl();
            //Backbone.history.navigate("#test/" + App.currentModule + "/" + App.currentLevel + "/" + App.currentExercise, {trigger: true, replace: true})
        },
        onCancelClicked: function () {
            Backbone.history.navigate("", true);
        },
    });
    var CountDownAndTextScrollView = Marionette.Layout.extend({
        template: "pages/tests/readspeed/exercise/skimview",
        regions: {
            textScrollerRegion: ".textScrollerRegion"
        },
        events: {
            "click .btnStart": "startCountDown",
            "click .btnSkip": "skipThisExercise"
        },
        ui: {
            btnStart: ".btnStart",
            btnSkip: ".btnSkip",
            lblInformation: ".information",
        },
        onShow: function () {
            /// This code is for removing the skip-button for not-unlocked users 
            /// (only actually implemented for f4-exercises; this is here in case we want to do the same for the tests)
            // if (!config.will_modules_be_locked_untill_progress) {
            //     $(".btnSkip").show();
            // }
            // else {
            //     $(".btnSkip").hide();
            // }
            $(".btnSkip").show();
        },
        onClose: function () {
            clearInterval(this.progressInterval);
        },
        hideInfoAndStartButton: function (args) {
            this.ui.lblInformation.animate({ opacity: 0 });
            TweenMax.to(this.ui.btnSkip, 0.5, { autoAlpha: 0 });
            TweenMax.to(this.ui.btnStart, 0.5, { autoAlpha: 0 });
        },
        startCountDown: function () {
            console.log("skim started");
            this.skim = true;
            $(this.regions.textScrollerRegion).addClass("skim-size-countdown");
            this.hideInfoAndStartButton();
            var countdownView = new App.Taskviews.Countdownview.View();
            this.listenTo(countdownView, "countdown:complete", this.onCountDownComplete, this);
            this.textScrollerRegion.show(countdownView);
            countdownView.start();
        },
        onCountDownComplete: function () {
            $(this.regions.textScrollerRegion).removeClass("skim-size-countdown");
            this.startScrollingText();
        },
        startScrollingText: function () {
            var scrollingView = new ScrollView({
                model: this.model
            });
            this.textScrollerRegion.show(scrollingView);
            this.listenTo(scrollingView, "scrollingtext:complete", this.onScrollintTextComplete, this);
            scrollingView.start();
            this.progressInterval = setInterval(this.updateProgress.bind(this), 500);
        },
        updateProgress: function () {
            var value = Math.abs($(".view").position().top) / $(".view").height() * 100 >> 0;
            if (value >= 100) {
                clearInterval(this.progressInterval);
                value = 100;
            }
            App.vent.trigger("exercise:progress:updated", value);
        },
        onScrollintTextComplete: function () {
            $(".textScrollerRegion").css({
                border: "none",
                height: "auto"
            });
            clearInterval(this.progressInterval);
            this.trigger("exercise:complete");
        },
        skipThisExercise: function () {
            console.log("skim skip");
            this.skim = false;
            App.vent.trigger("skip:skim");
        }
    });
    var ScrollView = Marionette.ItemView.extend({
        template: "pages/tests/readspeed/exercise/scrollview",
        templateHelpers: {
            getText: function () {
                return this.text;
            }
        },
        ui: {
            "viewContainer": ".viewContainer",
            "text": ".view"
        },
        onShow: function () {
            //Hyphenator.run();
        },
        start: function () {
            var wpm = this.model.get("wpm");
            var height = this.ui.viewContainer.get(0).scrollHeight - this.ui.text.position().top;
            var duation = this.getReadTimeInSeconds(wpm, this.countWords(this.ui.text.text()));
            this.ui.text.bind('webkitTransitionEnd transitionend otransitionend MSTransitionEnd', this.onComplete.bind(this));
            this.createAnimation(this.ui.text, duation, height);
        },
        onComplete: function (e) {
            this.ui.text.unbind('webkitTransitionEnd transitionend otransitionend MSTransitionEnd');
            this.trigger("scrollingtext:complete");
        },
        countWords: function (value) {
            if (value) {
                return value.replace(/\<.*?\>|\\r|\\n|\\t/g, "").match(/[^\s]+/g).length;
            }
            return 1;
        },
        getReadTimeInSeconds: function (wpm, numWords) {
            return 60 / wpm * numWords;
        },
        createAnimation: function ($el, duation, height) {
            var value = "top [@duation]s linear".replace(/\[@duation\]/g, duation);
            $el.css({
                top: -height,
                "-webkit-transition": value,
                "-moz-transition": value,
                "-ms-transition": value,
                "-o-transition": value,
                "transition": value
            });
        }
    });
});
//# sourceMappingURL=exersice.views.js.map;
 /***************************/ 
App.module("Pages.Tests.Intro", function (Intro, App, _Backbone, Marionette, $, _) {
    function incrementGreenRetry() {
    }
    Intro.View = Marionette.ItemView.extend({
        className: "test-intro",
        template: "pages/tests/readspeed/intro/test.intro",
        templateHelpers: {
            getTitle: function () {
                switch (App.currentModule) {
                    case "t1":
                        return App.translate("starttest-single");
                    case "t2":
                        return App.translate("mellemtest-single") + " 1";
                    case "t3":
                        return App.translate("mellemtest-single") + " 2";
                    case "t4":
                        return App.translate("sluttest-single");
                }
            },
            getIntroText: function () {
                switch (App.currentModule) {
                    case "t1":
                        return App.translate("test-intro-t1");
                    case "t2":
                        return App.translate("test-intro-t2");
                    case "t3":
                        return App.translate("test-intro-t3");
                    case "t4":
                        return App.translate("test-intro-t4");
                }
            }
        },
        ui: {
            confirmDialog: ".confirm-action-overlayer-test-intro",
        },
        fastButtonEvents: {
            "click .btnStart": "onStartClicked",
            "click .btnConfirm": "onConfirmClicked",
            "click .btnCancle": "onCancleClicked"
        },
        onShow: function () {
            $("#profileMenuRegion").addClass("display-none");
            switch (App.currentModule) {
                case "t1":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(2);
                    break;
                case "t2":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(7);
                    break;
                case "t3":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(8);
                    break;
                case "t4":
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(9);
                    break;
            }
            if (App.request("entities:isLevelComplete"))
                this.ui.confirmDialog.show();
            else
                this.ui.confirmDialog.hide();
        },
        onStartClicked: function () {
            var testIndex;
            switch (App.currentModule) {
                case "t1":
                    testIndex = 0;
                    break;
                case "t2":
                    testIndex = 1;
                    break;
                case "t3":
                    testIndex = 2;
                    break;
                case "t4":
                    testIndex = 3;
                    break;
            }
            if (App.userdata.tests[testIndex].isComplete) {
                ///The user is repeating a already approved test. This is unwanted user behavior. Storing wpm from last test.
                if (config.tests_can_be_retaken) {
                    if (App.userdata.tests[testIndex].retryPassed) {
                        ///no value stored in for retrying
                    }
                    else {
                        App.userdata.tests[testIndex].retryPassed = [];
                    }
                    App.userdata.tests[testIndex].retryPassed.push({ wpm: App.userdata.tests[testIndex].wpm, correctCount: App.userdata.tests[testIndex].correctCount });
                }
            }
            else {
                ///retry failed test, count up
                if (App.userdata.tests[testIndex].wrongCount + App.userdata.tests[testIndex].correctCount != 0) {
                    if (App.userdata.tests[testIndex].retryFailed) {
                        ///no value stored in for retrying
                    }
                    else {
                        App.userdata.tests[testIndex].retryFailed = [];
                    }
                    App.userdata.tests[testIndex].retryFailed.push({ wpm: App.userdata.tests[testIndex].wpm, correctCount: App.userdata.tests[testIndex].correctCount });
                }
            }
            this.trigger("createExerciseView");
        },
        onConfirmClicked: function () {
            this.ui.confirmDialog.hide();
        },
        onCancleClicked: function () {
            _Backbone.history.navigate("", true);
        },
    });
});
//# sourceMappingURL=intro.page.js.map;
 /***************************/ 
App.module("Pages.Tests.ReadSpeed", function (ReadSpeed, App, _Backbone, Marionette, $, _) {
    ReadSpeed.Controller = {
        createExerscisePage: function (region) {
            var objectives = new _Backbone.Collection();
            var model = new _Backbone.Model();
            var view = new ReadSpeed.Exercise.View({ collection: objectives });
            region.show(view);
            var streamedText;
            if (App.userdata._dataset && App.userdata._dataset.tests) {
                if (!App.userdata.testOrderID) {
                    App.userdata.testOrderID = { "t1": 0, "t2": 1, "t3": 2, "t4": 3 };
                }
                if (App.userdata.shouldRandomizeTests == true) {
                    App.userdata.testOrderID = shuffleTestIds(App.userdata.testOrderID);
                    App.userdata.shouldRandomizeTests = false;
                }
                streamedText = App.userdata._dataset.tests[App.userdata.testOrderID[App.currentModule]];
            }
            else {
                console.log("using local copy of texts");
            }
            var configuration = { filePath: App.request("exercise:data:tests") };
            if (streamedText) {
                configuration.filePath = "assets/json/txt-0.json";
                CreateViewModelFromData(configuration, streamedText);
            }
            else {
                $.getJSON(configuration.filePath + "?cb=" + (+new Date())).fail(function () {
                    console.error(configuration.filePath + " " + App.translate("updatetheapp"));
                    alert(App.translate("updatetheapp"));
                });
                App.request("entities:dataAccess:loadDocument", configuration.filePath).done(function (data) {
                    CreateViewModelFromData(configuration, data);
                }).fail(function () {
                    console.error("Failed to load file3" + " " + configuration.filePath);
                    alert("Failed to load file3: " + configuration.filePath);
                });
            }
            function shuffleTestIds(shuffleObject) {
                var arrayL = [shuffleObject["t1"], shuffleObject["t2"], shuffleObject["t3"], shuffleObject["t4"]];
                arrayL = shuffle(arrayL);
                return { "t1": arrayL[0], "t2": arrayL[1], "t3": arrayL[2], "t4": arrayL[3] };
            }
            function CreateViewModelFromData(configuration, data) {
                ///Randomize question order when retaking test
                var randomize = App.request("entities:isRetaking");
                var objectivesAndAnswers = [];
                for (var i = 0; i < data["objectives"].length; i++) {
                    objectivesAndAnswers[i] = [data["objectives"][i], data["correctResponses"].charAt(i)];
                    var responses = data["objectives"][i]["responses"];
                    ///Remove empty elements
                    for (var k = responses.length - 1; k >= 0; k--) {
                        if (!data["objectives"][i]["responses"][k].text || data["objectives"][i]["responses"][k].text.length == 0) {
                            data["objectives"][i]["responses"].splice(k, 1);
                        }
                    }
                }
                if (randomize) {
                    objectivesAndAnswers = shuffle(objectivesAndAnswers);
                }
                for (var j = 0; j < data["objectives"].length; j++) {
                    data["objectives"][j] = objectivesAndAnswers[j][0];
                    data["correctResponses"] = setCharAt(data["correctResponses"], j, objectivesAndAnswers[j][1]);
                }
                ///configuration {"filePath":"assets/json/dan_being_pressured/tests/txt-1.json?40331504162988478"}
                _.extend(configuration, data);
                objectives.reset(data);
                view.createModel(configuration);
            }
            function shuffle(array) {
                var currentIndex = array.length, temporaryValue, randomIndex;
                // While there remain elements to shuffle...
                while (0 !== currentIndex) {
                    // Pick a remaining element...
                    randomIndex = Math.floor(Math.random() * currentIndex);
                    currentIndex -= 1;
                    // And swap it with the current element.
                    temporaryValue = array[currentIndex];
                    array[currentIndex] = array[randomIndex];
                    array[randomIndex] = temporaryValue;
                }
                return array;
            }
            function setCharAt(str, index, chr) {
                if (index > str.length - 1)
                    return str;
                return str.substr(0, index) + chr + str.substr(index + 1);
            }
        }
    };
});
//# sourceMappingURL=readspeed.controller.js.map;
 /***************************/ 
App.module("Pages.Tests.ReadSpeed.Result", function (Result, App, _Backbone, Marionette, $, _) {
    Result.View = FlowPage.extend({
        template: "pages/tests/readspeed/result/test.result.page",
        regions: {
            "objectiveRegion": ".validated-responses .content"
        },
        ui: {
            btnToMannyErrors: ".btnToMannyErrors",
            btnNextAttempt: ".btnNextAttempt",
            btnContinue: ".btnContinue",
            btnCompareSpeed: ".btnCompareSpeed",
            placeholderDiv: ".placeholderDiv"
        },
        fastButtonEvents: {
            "click .btnNextAttempt": "retry",
            "click .btnToMannyErrors": "retry",
            "click .btn-close": "onCloseClicked",
            "click .btnContinue": "onCloseClicked",
            "click .btnCompareSpeed": "onCompareButtonClicked"
        },
        templateHelpers: {
            getNumObjectives: function () {
                console.log("ResultView: objectivesCount", this.objectivesCount);
                return this.objectivesCount || 0;
            },
            getCorrectCount: function () {
                return this.correctCount;
            },
            getWrongCount: function () {
                return this.wrongCount;
            },
            getWordCount: function () {
                return this.wordcount;
            },
            getTimeElapsed: function () {
                return this.timeElapsed;
            },
            getWPM: function () {
                if (this.wpm >= 1200) {
                    return '<span class="large">' + App.translate("text-not-read") + '</span>';
                }
                return '<span class="xlarge">' + this.wpm + '</span>';
            },
            getPageTitle: function () {
                switch (_Backbone.history.getFragment().match(/t\d/)[0]) {
                    case "t1":
                        return App.translate("starttest-single");
                    case "t2":
                        return App.translate("mellemtest-single") + " 1";
                    case "t3":
                        return App.translate("mellemtest-single") + " 2";
                    case "t4":
                        return App.translate("sluttest-single");
                }
                return App.translate("starttest-single");
            }
        },
        initialize: function () {
            var currentModule = (!App.currentModule) ? "t1" : App.currentModule;
            var data = App.request("entities:data:query", App.request("entities:build:query", currentModule));
            this.model = new _Backbone.Model(data);
        },
        onShow: function () {
            console.log("readspeed configuration view onShow");
            $("#profileMenuRegion").removeClass("display-none");
            var userResponses = App.request("get:saved:responses");
            var thisModule = (!App.currentModule) ? "t1" : App.currentModule;
            if (thisModule == "t1") {
                this.ui.btnCompareSpeed.addClass("display-none");
                this.ui.placeholderDiv.removeClass("display-none");
            }
            ///Only show what the student answered instead of all 3 options
            for (var i = 0; i < userResponses.length; i++) {
                var trimmedResponsArray = [userResponses[i].responses[0]];
                for (var j = 0; j < userResponses[i].responses.length; j++) {
                    if (userResponses[i].responses[j].state != "") {
                        trimmedResponsArray = [userResponses[i].responses[j]];
                    }
                }
                userResponses[i].responses = trimmedResponsArray;
            }
            var objectives = new Objectives({ collection: new _Backbone.Collection(userResponses) });
            this.objectiveRegion.show(objectives);
            App.setQueryFromFragment();
            this.onShowComplete();
            App.vent.trigger("update:user:profile");
            if (this.model.get("isComplete")) {
                // console.log("Updating the improvementPercentage")
                this.ui.btnNextAttempt.removeClass("display-none");
                this.ui.btnContinue.removeClass("display-none");
            }
            else {
                // console.log("User failed the test, the improvementPercentage will remain unchanged")
                this.ui.btnToMannyErrors.removeClass("display-none");
            }
        },
        transitionIn: function () {
            var $el = $(".test-result");
            var $el2 = $(".validated-responses");
            var ease = Power3.easeInOut;
            var ease1 = Power3.easeInOut;
            TweenMax.fromTo($el, 0.5, { scale: 0.5, right: 236 }, { scale: 1, right: 236, ease: ease1 });
            TweenMax.to($el, 0.4, { right: 136, delay: 0.5, ease: ease });
            TweenMax.fromTo($el2, 0.5, { left: 80, scale: 1, rotationY: 90, display: "block" }, { scale: 1, rotationY: 0, delay: 0.5, ease: ease });
            setTimeout(this.transitionInComplete.bind(this), 500);
        },
        transitionOut: function () {
            var delay = 0;
            TweenMax.fromTo($(".test-result-page"), 0.5, { scale: 1, autoAlpha: 1 }, {
                scale: 0,
                autoAlpha: 0,
                delay: delay,
                ease: Power3.easeOut
            });
            setTimeout(this.transitionOutComplete.bind(this), 200);
        },
        retry: function () {
            var query = "#test/{0}/{1}/{2}".format(App.currentModule, App.currentLevel.toString(), App.currentExercise);
            _Backbone.history.navigate(query, true);
        },
        onCloseClicked: function () {
            App.vent.trigger("banner:prevPage");
        },
        onCompareButtonClicked: function () {
            App.vent.trigger("barmenu:onCompareButtonClicked");
        },
    });
    var Response = Marionette.ItemView.extend({
        tagName: "li",
        onShow: function () {
            this.$el.text(this.model.get("text"));
            this.$el.addClass(this.model.get("state"));
            if (this.model.get("isTheCorrectResponse"))
                this.$el.css({ color: "green" });
        }
    });
    var Objective = Marionette.CompositeView.extend({
        template: "pages/tests/readspeed/result/test.result.objective",
        itemView: Response,
        itemViewContainer: "ul",
        initialize: function () {
            this.collection = new _Backbone.Collection(this.model.get("responses"));
        }
    });
    var Objectives = Marionette.CollectionView.extend({
        itemView: Objective
    });
});
//# sourceMappingURL=readspeed.configuration.views.js.map;
 /***************************/ 
App.module("Pages.Videos.List", function (List, App, _Backbone, Marionette, $, _) {
    List.Page = FlowPage.extend({
        template: "pages/videos/list/videos.list",
        className: "videos",
        events: {
            "click .video-thumbnail": "onVideoClickked",
        },
        onShow: function () {
            this.enableUnlockedVideos();
            this.onShowComplete();
            $("#profileMenuRegion").addClass("display-none");
        },
        enableUnlockedVideos: function () {
            this.$el.find(".video-thumbnail").each(function () {
                var el = $(this);
                if (config.is_videos_in_archive_locked_as_default) {
                    var videoID = parseInt(el.data("video-id"));
                    var data = _.where(App.userdata.videos, { videoID: videoID })[0];
                    if (data.isUnlocked)
                        el.removeClass("disabled");
                }
                else {
                    el.removeClass("disabled");
                }
            });
        },
        transitionIn: function () {
            var animationData = [];
            //var xPositions = [0, 300, 600, 800, 0, 300, 600, 800]
            var xPositions = [75, 434, 614, 795, 75, 255, 434, 614, 794];
            $(".video-thumbnail").each(function (i) {
                var el = $(this);
                animationData.push({
                    el: el,
                    from: { top: ((i < 4) ? "-=700" : "+=794"), left: "+=0" },
                    to: { top: el.position().top, left: el.position().left }
                });
            });
            for (var i in animationData) {
                var data = animationData[i];
                var extentions = {
                    ease: Power3.easeOut
                };
                TweenMax.fromTo(data.el, 0.7, data.from, _.extend(data.to, extentions));
            }
            TweenMax.fromTo(this.$el.find(".page-title"), 0.4, { alpha: 0 }, { alpha: 1 }).delay(1);
            setTimeout(this.onTransitionInComplete.bind(this), 1000);
        },
        transitionOut: function () {
            console.log("transitionOut");
            var animationData = [];
            var xPositions = [75, 434, 614, 795, 75, 255, 434, 614, 794];
            $(".video-thumbnail").each(function (i) {
                var el = $(this);
                animationData.push({
                    el: el,
                    to: { top: ((i < 4) ? -200 : 794), left: xPositions[i] },
                    from: { top: el.position().top, left: el.position().left }
                });
            });
            for (var i in animationData) {
                var data = animationData[i];
                var extentions = {
                    ease: Power3.easeOut
                };
                TweenMax.fromTo(data.el, 0.5, data.from, _.extend(data.to, extentions));
            }
            TweenMax.fromTo(this.$el.find(".page-title"), 0.5, { alpha: 1 }, { alpha: 0 });
            setTimeout(this.transitionOutComplete.bind(this), 1000);
        },
        onVideoClickked: function (e) {
            var videoID = parseInt($(e.currentTarget).data("video-id"));
            //var videoData = _.where(App.Entities.StaticData.videos, {id: videoID})[0]
            var videoData = App.request("getVideoByID", videoID);
            App.Pages.Videos.Controller.show(videoData);
            //App.LogEvent("onVideoClicked " + videoID);
        }
    });
});
//# sourceMappingURL=videos.list.js.map;
 /***************************/ 
App.module("Pages.Videos.Show", function (Show, App, _Backbone, Marionette, $, _) {
    Show.Page = Marionette.ItemView.extend({
        template: "pages/videos/show/videos.show",
        className: "video",
        events: {
            "click .btnCloseVideo": "onCloseClicked"
        },
        onShow: function () {
            $("#_video").attr("poster", this.model.get("poster"));
            $("#_videoSrc").attr("src", this.model.get("src"));
        },
        onCloseClicked: function () {
            App.execute("close:popup");
        }
    });
});
//# sourceMappingURL=videos.show.js.map;
 /***************************/ 
App.module("Pages.Videos", function (Videos, App, _Backbone, Marionette, $, _) {
    Videos.Controller = {
        list: function () {
        },
        show: function (data) {
            //console.log("videos.controller.ts: " + JSON.stringify(data) );
            App.videoPopupRegion.show(new App.Pages.Videos.Show.Page({ model: new _Backbone.Model(data) }));
            $(App.videoPopupRegion.el).removeClass("display-none");
        }
    };
    //App.Pages.Videos.Controller.show()
    App.commands.setHandler("close:popup", function () {
        App.videoPopupRegion.reset();
        $(App.videoPopupRegion.el).addClass("display-none");
    });
    ///Call this in appropriate places to start up videos
    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched = function PlayVideoIfPopupEnabledAndHaveNotBeenWatched(videoID) {
        if (config.will_make_videos_popup) {
            for (var i = 0; i < App.userdata.videos.length; i++) {
                if (App.userdata.videos[i].videoID == videoID) {
                    if (!App.userdata.videos[i].haveBeenWatched) {
                        setTimeout(function () {
                            var objData = App.request("getVideoByID", videoID);
                            App.Pages.Videos.Controller.show(objData);
                        }, 700);
                        App.userdata.videos[i].haveBeenWatched = true;
                    }
                }
            }
        }
    };
});
//# sourceMappingURL=videos.controller.js.map;
 /***************************/ 
App.module("Pages.WorkSpace", function (WorkSpace, App, _Backbone, Marionette, $, _) {
    WorkSpace.Page = FlowPage.extend({
        className: "workspace levelScrollWrapper",
        template: "pages/workspace/show/workspace.page",
        regions: {
            boxRegion: ".box-region",
            stackBoxRegion: ".stack-box-region"
        },
        templateHelpers: {
            getModule: function () {
                App.setQueryFromFragment();
                return App.translate("modul-single") + " " + App.currentModule.match(/(\d)/)[1];
            },
            getLevel: function () {
                App.setQueryFromFragment();
                return App.translate("niveau") + " " + App.currentLevel;
            },
        },
        onShow: function () {
            App.setQueryFromFragment();
            try {
                var querry = App.request("entities:build:query", App.currentModule, App.currentLevel);
                var data = App.request("entities:data:query", querry).exercises;
                var boxCollection = new _Backbone.Collection(data);
                var boxes = new Boxes({ collection: boxCollection });
                var stackBoxes = new StackBoxes({ collection: boxCollection });
                this.boxRegion.show(boxes);
                this.stackBoxRegion.show(stackBoxes);
                this.listenTo(boxes, "clicked", this.onExerciseClicked, this);
                this.listenTo(stackBoxes, "clicked", this.onExerciseClicked, this);
                this.onShowComplete();
            }
            catch (e) {
                console.info("ERROR:", e.message);
            }
        },
        onExerciseClicked: function () {
            _Backbone.history.navigate("#configuration/" + App.getQuerryString(), true);
        },
        transitionIn: function () {
            animateBoxes();
            setTimeout(this.transitionInComplete.bind(this), 600);
        },
        transitionOut: function () {
            TweenMax.to($(".nn1"), 1, { left: -1100 });
            TweenMax.to($(".nn2"), 1, { top: -1000 });
            TweenMax.to($(".nn4"), 1, { top: 1350 });
            TweenMax.to($(".nn3"), 1, { left: 1700 });
            $(".breadcrum").hide();
            $(".path").hide();
            setTimeout(this.transitionOutComplete.bind(this), 1000);
        }
    });
    var Box = Marionette.ItemView.extend({
        template: "pages/workspace/show/workspace.box",
        ui: {
            "icon": ".icon",
        },
        triggers: {
            "click": "onClicked",
        },
        templateHelpers: {
            getTitle: function () {
                var title = "";
                switch (this.exerciseID) {
                    case "f1":
                        title = App.translate("fiksering-single");
                        break;
                    case "f2":
                        title = App.translate("spaendevidde-single");
                        break;
                    case "f3":
                        title = App.translate("arbejdshukommelse-single");
                        break;
                    case "f4":
                        title = App.translate("laesetraening-single");
                        break;
                }
                return title;
            },
            getType: function () {
                var title = "";
                switch (this.exerciseID) {
                    case "f1":
                        title = "F1";
                        break;
                    case "f2":
                        title = "F2";
                        break;
                    case "f3":
                        title = "F3";
                        break;
                    case "f4":
                        title = "F4";
                        break;
                }
                return title;
            },
            getIcon: function () {
                return "icon-" + this.exerciseID;
            },
            getAffix: function () {
                return (this.exerciseID == "f4") ? "darkskin" : "defaultskin";
            }
        },
        onShow: function () {
            this.setClassNames();
            this.setAttemptStatus();
            this.setCurrentAttempt();
        },
        setClassNames: function () {
            var parentDiv = this.$el.parent().prop('className');
            console.log(parentDiv);
            this.$el.addClass(this.model.get("exerciseID"));
            if (parentDiv == "box-container") {
                this.$el.addClass("nn" + this.model.get("exerciseID").match(/\d/)[0]);
            }
            else {
                this.$el.addClass("m" + this.model.get("exerciseID").match(/\d/)[0]);
                this.$el.addClass("col-xs-3");
            }
        },
        setAttemptStatus: function () {
            _.each(this.model.attributes.attempts, this.setAttemptState.bind(this));
        },
        setAttemptState: function (attempt, i) {
            this.$el.find(".progress-box").eq(i).addClass(this.getAttemptStatus(attempt, this.model.get("exerciseID")));
        },
        getAttemptStatus: function (object, exerciseID) {
            return App.request("getAttemptStatusClass", object, exerciseID);
        },
        setCurrentAttempt: function () {
            if (!this.$el.find(".progress-box.failed").length && !this.$el.find(".progress-box.current").length)
                this.$el.find(".progress-box.not-attempted:first").removeClass("not-attempted").addClass("current");
        }
    });
    var Boxes = Marionette.CollectionView.extend({
        className: "box-container",
        itemView: Box,
        itemviewEvents: {
            "itemview:onClicked": "onClicked"
        },
        onClicked: function (view) {
            App.currentExercise = view.$el.attr("class").match(/f\d/)[0];
            this.trigger("clicked");
        }
    });
    var StackBoxes = Marionette.CollectionView.extend({
        className: "stack-box-container row",
        itemView: Box,
        itemviewEvents: {
            "itemview:onClicked": "onClicked"
        },
        onClicked: function (view) {
            App.currentExercise = view.$el.attr("class").match(/f\d/)[0];
            this.trigger("clicked");
        }
    });
    // Helpers -----------------------------------------------------------------------
    function boxAnimation($el, fromY, fromX, fromRotation, newY, newX, delay) {
        var time = 0.4;
        TweenMax.fromTo($el, time, { force3D: true, top: fromY, left: fromX, rotation: fromRotation, autoAlpha: 0 }, { force3D: true, rotationZ: 0, top: newY, left: newX, ease: Power3.easeOut, delay: delay, autoAlpha: 1 });
        var tl = new TimelineLite();
        tl.to($el, time * 0.2, {
            force3D: true,
            scale: 1.2,
            delay: delay
        });
        tl.to($el, time * 0.8, { force3D: true, scale: 1 });
        var tl = new TimelineLite();
        tl.from($el.find(".progress-container"), 0.3, { left: 90, autoAlpha: 0, delay: 0.2 });
    }
    function animateBoxes() {
        $(".box-container").removeClass("display-none");
        $(".nn1, .nn2, .nn3, .nn4").css({ opacity: 0 });
        $(".breadcrum").css({ display: "block", opacity: 0 }).delay(400).animate({ opacity: 1 }, 1000);
        $(".path").css({ display: "block", opacity: 0 }).delay(400).animate({ opacity: 1 }, 1000);
        // explode the workspace boxes
        setTimeout(function () {
            $(".nn1, .nn2, .nn3, .nn4").css({ opacity: 1 });
            boxAnimation($(".nn1"), -75, -75, 50, -27, -366, 0);
            boxAnimation($(".nn2"), -75, -75, -50, -252, -122, 0);
            boxAnimation($(".nn3"), -75, -75, -50, -167, 191, 0);
            boxAnimation($(".nn4"), -75, -75, 50, 73, 30, 0);
        }, 200);
        TweenMax.to($(".sub-box"), 0.2, { delay: 0.5 });
    }
});
//# sourceMappingURL=workspace.pages.js.map;
 /***************************/ 
App.module("Pages.WorkSpace", function (WorkSpace, App, _Backbone, Marionette, $, _) {
    WorkSpace.Controller = {
        create: function () {
            return new WorkSpace.Page();
        }
    };
});
//# sourceMappingURL=workspace.controller.js.map;
 /***************************/ 
App.module("Routers", function (Routers, App, _Backbone, Marionette, $, _) {
    var flowPageContainer = null;
    var FlowPageContainer = Marionette.Layout.extend({
        className: "home background",
        template: "pages/home/home.page.layout",
        regions: {
            region1: ".region1",
            region2: ".region2"
        },
        onShow: function () {
            this.controller = new FlowController({
                region1: this.region1,
                region2: this.region2
            });
        },
        showPage: function (view) {
            this.controller.show(view, "cross");
        }
    });
    var Controller = {
        _flowContainerShowPage: function (view) {
            flowPageContainer.showPage(view);
        },
        _isLoggedin: function () {
            return DataStore.API().authenticated;
        },
        _forceLoginPage: function () {
            var url = localStorage.getItem("backurl");
            localStorage.removeItem("backurl");
            if (url) {
                window.location.href = url;
            }
            else {
                console.log("_forceLoginPage language: " + config.language);
                _;
                Backbone.history.navigate("#login", true);
            }
        },
        _checkAuthentication: function () {
            console.log("localStorage group check");
            console.debug("_checkAuthentication " + config.language);
            if (this._isLoggedin()) {
                return true;
            }
            this._forceLoginPage();
            return false;
        },
        home: function () {
            console.log("Controller home");
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(new App.Pages.Home.HomePage());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        login: function () {
            console.log("Controller login");
            this._flowContainerShowPage(new App.Pages.Login.Page());
            App.ga(App.getGaPath());
        },
        workspace: function () {
            console.log("Controller workspace");
            console.log("localStorage group workspace");
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(new App.Pages.WorkSpace.Page());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        configuration: function () {
            console.log("Controller configuration");
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(App.Pages.Configuration.Controller.createPage());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        exercise: function () {
            console.log("Chosen reading speed: " + App.userDefinedExerciseSetting);
            if (this._checkAuthentication()) {
                if (App.userDefinedExerciseSetting == 0) {
                    ///configuration was lost or set to zero, return to configuration page
                    this.configuration();
                }
                else {
                    this._flowContainerShowPage(new App.base.ExercisePage());
                }
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        test: function () {
            console.log("Controller test");
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(new App.base.TestPage());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        result: function () {
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(new App.Pages.Tests.ReadSpeed.Result.View());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        videos: function () {
            console.log("Controller videos");
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(new App.Pages.Videos.List.Page());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        },
        diploma: function () {
            console.log("Controller diploma");
            if (this._checkAuthentication()) {
                this._flowContainerShowPage(new App.Pages.Diploma.Page());
                App.Banner.Init();
                App.ga(App.getGaPath());
            }
        }
    };
    var Router = Marionette.AppRouter.extend({
        controller: Controller,
        initialize: function () {
            this.route('', this.controller.home.bind(this.controller));
            this.route(/login/, this.controller.login.bind(this.controller));
            this.route(/test(.*)?/, this.controller.test.bind(this.controller));
            this.route(/videos/, this.controller.videos.bind(this.controller));
            this.route(/result(.*)?/, this.controller.result.bind(this.controller));
            this.route(/diploma(.*)?/, this.controller.diploma.bind(this.controller));
            this.route(/exercise(.*)?/, this.controller.exercise.bind(this.controller));
            this.route(/workspace(.*)?/, this.controller.workspace.bind(this.controller));
            this.route(/configuration(.*)?/, this.controller.configuration.bind(this.controller));
        }
    });
    App.addInitializer(function () {
        App.router = new Router();
        flowPageContainer = new FlowPageContainer();
        App.contentRegion.show(flowPageContainer);
        _Backbone.history.start();
    });
});
//# sourceMappingURL=router.js.map;
 /***************************/ 
var LOWER = /[a-z]/, UPPER = /[A-Z]/, DIGIT = /[0-9]/, DIGITS = /[0-9].*[0-9]/, SPECIAL = /[^a-zA-Z0-9]/, SAME = /^(.)\1+$/;
function uncapitalize(str) {
    return str.substring(0, 1).toLowerCase() + str.substring(1);
}
var MinimumRequirement = 4;
var GreatRequirement = 5;
function passwordRating(password, username) {
    var same = SAME.test(password), lower = LOWER.test(password), upper = UPPER.test(uncapitalize(password)), digit = DIGIT.test(password), digits = DIGITS.test(password), special = SPECIAL.test(password), email = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
    if (!password || password.length < 8)
        return 0;
    if (username && password.toLowerCase().match(username.toLowerCase()))
        return 1;
    if (email.test(password))
        return 2;
    if (same)
        return 3;
    if (lower && upper && digit || lower && digits || upper && digits || special)
        return 6;
    if (lower && upper || lower && digit || upper && digit)
        return 5;
    return 4;
}
App.module("ChangePassword", function (ChangePassword, App, _Backbone, Marionette, $, _) {
    ChangePassword.View = Marionette.ItemView.extend({
        template: "settings/change-password/change-password",
        templateHelpers: {
            test11112: "pols22aa24",
            getLanguage: function () {
                return config.language + "";
            }
        },
        setf4AsComplete: false,
        events: {
            "click .btnClose": "onCloseClicked",
            "click .btnChangePassword": "onChangePassword"
        },
        onCloseClicked: function () {
            App.vent.trigger("close:change-password-menu");
        },
        onChangePassword: function () {
            console.log("changePassword");
            var fetchedPassword = $(".txt_current_password").val();
            var fetchedNewPassword = $(".txt_new_password").val();
            var fetchedRepeatNewPassword = $(".txt_repeat_new_password").val();
            if (passwordRating(fetchedNewPassword, UserData.getUnicID()) < 4) {
                $(".status-message").text(App.translate("password-not-changed") + ": " + App.translate("password-to-weak"));
            }
            else if (fetchedNewPassword.localeCompare(fetchedRepeatNewPassword) == 0) {
                var changePasswordDataObject = {
                    password: fetchedPassword,
                    newPassword: fetchedNewPassword,
                };
                var deferred_1 = $.Deferred();
                $(".status-message").text("");
                DataStore.API().changePassword(changePasswordDataObject)
                    .done(function (data) {
                    deferred_1.resolve(data);
                    console.log("ChangePassword.ts deferred.resolve");
                    $(".status-message").text(App.translate("password-changed"));
                    $(".btnChangePassword").removeClass("display-inline-block");
                    $(".btnChangePassword").addClass("display-none");
                    $(".form-input-container").addClass("display-none");
                })
                    .fail(function () {
                    deferred_1.reject();
                    console.log("ChangePassword.ts deferred.reject");
                    $(".status-message").text(App.translate("password-not-changed") + ": " + App.translate("wrong-password"));
                });
            }
            else {
                $(".status-message").text(App.translate("password-not-changed") + ": " + App.translate("password-not-identical"));
            }
        },
        onShow: function () {
        },
        onClose: function () {
            _Backbone.history.navigate("", true);
        },
    });
    var Controller = {
        show: function () {
            $(App.utilPopupRegion.el).removeClass("display-none");
            App.utilPopupRegion.show(new ChangePassword.View());
        },
        close: function () {
            $(App.utilPopupRegion.el).addClass("display-none");
            App.utilPopupRegion.reset();
        }
    };
    App.addInitializer(function () {
        App.vent.on("show:change-password-menu", Controller.show);
        App.vent.on("close:change-password-menu", Controller.close);
    });
});
//# sourceMappingURL=change-password.js.map;
 /***************************/ 
App.module("GroupCode", function (GroupCode, App, _Backbone, Marionette, $, _) {
    var TokenRenewer = function (callback) {
        var username = localStorage.getItem("username");
        var userid = localStorage.getItem("userid");
        $.ajax({
            url: App.ServerUrl() + "/tokenrefresh",
            type: 'POST',
            cache: true,
            dataType: 'json',
            headers: {
                Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
            },
            data: {
                username: username,
                userid: userid
            }
        }).done(function (data) {
            console.log("done TokenRenewer: " + JSON.stringify(data));
            callback(null, data);
        }).fail(function (data) {
            console.error("fail TokenRenewer: " + JSON.stringify(data));
            callback(true);
        });
    };
    GroupCode.View = Marionette.ItemView.extend({
        template: "settings/group-code/group-code",
        templateHelpers: {
            getName: function () {
                return App.userdata.name;
            },
            getLanguage: function () {
                return config.language + "";
            },
            getGroupCode: function () {
                return localStorage.getItem("groupCode");
            }, administration: function () {
                return (localStorage.getItem("rights") == "admin");
            }
        },
        ui: {
            txtGroupName: ".txtGroupName",
            btnLogin: ".btnLogin"
        },
        events: {
            "click .btnClose": "onCloseClicked",
            "click .btn-administration": "onAdministrationClicked",
            "click .btnLogin": "onLoginClicked",
            "change .txtGroupName": "onTextInputChanged",
            "keyup  .txtGroupName": "onTextInputChanged"
        },
        onTextInputChanged: function () {
            var groupName = this.ui.txtGroupName.val();
            if (!/[^A-Za-z0-9]/.test(groupName) && groupName.length == 7) {
                this.ui.btnLogin.removeClass("disabled");
            }
            else {
                this.ui.btnLogin.addClass("disabled");
            }
        },
        onLoginClicked: function () {
            App.askForGroupId = false;
            var txtGroupName = $(".txtGroupName").val().toUpperCase();
            //Only admins (e.g. teachers) are allowed to log on to the demo app
            if ((txtGroupName == "DEMOAPP" || txtGroupName == "DEM0APP") && (localStorage.getItem("rights") != "admin")) {
                $(".status-message").text("Du kan ikke logge ind på demoappen som elev. Få dit rigtige hold ID af din lærer");
                console.log("demo app only for teachers");
            }
            else { //If you are an admin already logged in to demo app, just proceed
                if ((txtGroupName == "DEMOAPP" || txtGroupName == "DEM0APP") &&
                    (txtGroupName == localStorage.getItem("groupCode")) &&
                    (localStorage.getItem("rights") == "admin")) {
                    console.log("no changes to groupCode: " + txtGroupName + " continue to app");
                    App.vent.trigger("close:group-code-menu");
                    App.vent.trigger("changeInUserData");
                    App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(1);
                }
                else {
                    console.log("txtGroupName " + txtGroupName);
                    var errorMessage_1 = "Holdet eksisterer ikke. Få det rigtige Hold-ID af din lærer.";
                    $.ajax({
                        url: App.ServerUrl() + "/changeGroup",
                        type: 'POST',
                        cache: true,
                        dataType: 'json',
                        headers: {
                            Authorization: createBasicAuthenticationHeader(config.newAdmin.appAuthentication.name, config.newAdmin.appAuthentication.password)
                        },
                        data: {
                            userid: localStorage.getItem("userid"),
                            groupCode: txtGroupName
                        },
                        success: function (result) {
                            //console.log('Very searchable message! : ');
                            console.log(JSON.stringify(result));
                        }
                    }).done(function (data) {
                        if (data._saveData._id) {
                            App.UserProfile.savedataID = data._saveData._id;
                            console.log("changeGroup success: working on saveData file id:" + JSON.stringify(data._saveData._id));
                        }
                        else {
                            App.UserProfile.savedataID = data._saveData;
                            console.log("changeGroup success: working on saveData file id:" + JSON.stringify(data._saveData));
                        }
                        localStorage.setItem("groupCode", txtGroupName);
                        ///Data reguarding unlocked and videofreee should be present in this data
                        config.ProcessDescription(data);
                        Server.loadUserData()
                            .done(function (data) {
                            App.vent.trigger("close:group-code-menu");
                            App.PlayVideoIfPopupEnabledAndHaveNotBeenWatched(1);
                        })
                            .fail(function (data) {
                            console.error("User data not loaded: " + data);
                        });
                    }).fail(function (data) {
                        console.error("not a valid id error: " + JSON.stringify(data));
                        $(".status-message").text(errorMessage_1);
                    });
                }
            }
        },
        onShow: function () {
            var groupName = localStorage.getItem("groupCode");
            if (groupName && !/[^A-Za-z0-9]/.test(groupName) && groupName.length == 7) {
                this.ui.btnLogin.removeClass("disabled");
            }
        },
        onClose: function () {
            _Backbone.history.navigate("", true);
        },
        onAdministrationClicked: function () {
            TokenRenewer(function (err, data) {
                if (err) {
                    console.error("could not get new token for administration id:" + localStorage.getItem("userid"));
                }
                else {
                    if (config.mobile_app) {
                        window.open(App.serverUrl + "?frontreadtoken=" + data, "location=no");
                    }
                    else {
                        localStorage.setItem("backurl", window.location.href);
                        window.open(App.serverUrl + "?frontreadtoken=" + data, "_self");
                    }
                }
            });
        },
    });
    var Controller = {
        show: function () {
            $(App.utilPopupRegion.el).removeClass("display-none");
            App.utilPopupRegion.show(new GroupCode.View());
        },
        close: function () {
            $(App.utilPopupRegion.el).addClass("display-none");
            App.utilPopupRegion.reset();
        }
    };
    App.addInitializer(function () {
        App.vent.on("show:group-code-menu", Controller.show);
        App.vent.on("close:group-code-menu", Controller.close);
    });
});
//# sourceMappingURL=group-code.js.map;
 /***************************/ 
App.module("Developer", function (Developer, App, _Backbone, Marionette, $, _) {
    Developer.View = Marionette.ItemView.extend({
        template: "settings/show/developer.show",
        templateHelpers: {
            test11112: "pols224424",
            getLanguage: function () {
                return config.language + "";
            }
        },
        setf4AsComplete: false,
        events: {
            "click .btnClose": "onCloseClicked"
        },
        onCloseClicked: function () {
            App.vent.trigger("close:developermenu");
        },
        onShow: function () {
            this.setCurrentSelectedDatasetItemFromUserData();
            this.setCurrentVideoPopupBehaviorFromUserData();
        },
        onClose: function () {
            this.applyDataSetChanges();
            //this.applyVideoBehaviorChanges();
            this.applyF4CompleationChanges();
            _Backbone.history.navigate("", true);
            //alert("Dine ændringer er blevet gemt:\n- Dataset: ({0})\n- Video popup: ({1})\n- F4 completed: ({2})"
            //	.format(App.userdata.dataset, config.will_make_videos_popup, this.setf4AsComplete));
        },
        setCurrentSelectedDatasetItemFromUserData: function () {
            $(".dataset option[value=" + App.userdata.dataset + "]").attr("selected", true);
        },
        setCurrentVideoPopupBehaviorFromUserData: function () {
            $(".videoPopupBehavior option[value=" + config.will_make_videos_popup + "]").attr("selected", true);
        },
        applyDataSetChanges: function () {
            App.userdata.dataset = $(".dataset").val();
        },
        applyVideoBehaviorChanges: function () {
            console.log('onVideoBehaviorChanged');
            config.will_make_videos_popup = ($(".videoPopupBehavior").val() == "true");
        },
        applyF4CompleationChanges: function () {
            var doit = $(".setF4AsComplete").val() == "true";
            this.setf4AsComplete = doit;
            if (doit)
                this.setAllF4AsCompleted();
            else
                this.setAllF4AsInComplete();
        },
        setAllF4AsCompleted: function () {
            console.log("setAllF4AsCompleted");
            App.execute("entities:exercise:setComplete", "m1", "1", "f4");
            App.execute("entities:exercise:setComplete", "m1", "2", "f4");
            App.execute("entities:exercise:setComplete", "m1", "3", "f4");
            App.execute("entities:exercise:setComplete", "m2", "4", "f4");
            App.execute("entities:exercise:setComplete", "m2", "5", "f4");
            App.execute("entities:exercise:setComplete", "m2", "6", "f4");
            App.execute("entities:exercise:setComplete", "m3", "7", "f4");
            App.execute("entities:exercise:setComplete", "m3", "8", "f4");
            App.execute("entities:exercise:setComplete", "m3", "9", "f4");
        },
        setAllF4AsInComplete: function () {
            console.log("setAllF4As INCompleted");
            App.execute("entities:exercise:setInComplete", "m1", "1", "f4");
            App.execute("entities:exercise:setInComplete", "m1", "2", "f4");
            App.execute("entities:exercise:setInComplete", "m1", "3", "f4");
            App.execute("entities:exercise:setInComplete", "m2", "4", "f4");
            App.execute("entities:exercise:setInComplete", "m2", "5", "f4");
            App.execute("entities:exercise:setInComplete", "m2", "6", "f4");
            App.execute("entities:exercise:setInComplete", "m3", "7", "f4");
            App.execute("entities:exercise:setInComplete", "m3", "8", "f4");
            App.execute("entities:exercise:setInComplete", "m3", "9", "f4");
        },
    });
    var Controller = {
        show: function () {
            $(App.utilPopupRegion.el).removeClass("display-none");
            App.utilPopupRegion.show(new Developer.View());
        },
        close: function () {
            $(App.utilPopupRegion.el).addClass("display-none");
            App.utilPopupRegion.reset();
        }
    };
    App.addInitializer(function () {
        App.vent.on("show:developermenu", Controller.show);
        App.vent.on("close:developermenu", Controller.close);
    });
});
//# sourceMappingURL=developer.show.js.map;
 /***************************/ 
App.module("Developer.Textbrowser", function (Textbrowser, App, _Backbone, Marionette, $, _) {
    var View = Marionette.ItemView.extend({
        template: "developer/textbrowser/textbrowser",
        events: {
            "click .btnClose": "onCloseClicked",
            "click .btn-f4-load": "onf4LoadClicked",
            "click .btn-f4-prev": "onf4PrevClicked",
            "click .btn-f4-next": "onf4NextClicked",
            "click .btn-test-load": "onTestLoadClicked",
            "click .btn-test-prev": "onTestPrevClicked",
            "click .btn-test-next": "onTestNextClicked"
        },
        ui: {
            dataset: ".dataset",
            f4Text: ".f4-text",
            testText: ".test-text",
            objectives: ".objectives",
            textPreview: ".textPreview"
        },
        onShow: function () {
            console.log('textbrowser:show');
        },
        onCloseClicked: function () {
            App.vent.trigger("close:developer-textbrowser");
        },
        onf4LoadClicked: function () {
            this.loadText();
        },
        onf4PrevClicked: function () {
        },
        onf4NextClicked: function () {
        },
        onTestLoadClicked: function () {
        },
        onTestPrevClicked: function () {
        },
        onTestNextClicked: function () {
        },
        loadText: function () {
            var self = this;
            var path = "assets/json/{0}/{1}/{2}".format("frontread", "f4", "txt-1.json");
            $.get(path + "?cb=" + (+new Date())).done(function (data) {
                self.ui.textPreview.html(data.text);
            });
        }
    });
    var Controller = {
        show: function () {
            $(App.utilPopupRegion.el).removeClass("display-none");
            App.utilPopupRegion.show(new View());
        },
        close: function () {
            $(App.utilPopupRegion.el).addClass("display-none");
            App.utilPopupRegion.reset();
        }
    };
    App.addInitializer(function () {
        App.vent.on("show:developer-textbrowser", Controller.show);
        App.vent.on("close:developer-textbrowser", Controller.close);
        //App.vent.trigger("show:developer-textbrowser");
    });
});
//# sourceMappingURL=textbrowser.js.map;
 /***************************/ 
App.module("user.profile.barmenu", function (barmenu, App, _Backbone, Marionette, $, _) {
    var View = Marionette.ItemView.extend({
        className: "profile-menu",
        template: "user/profile/barmenu/show/barmenu.show",
        fastButtonEvents: {
            "click .btn-compare": "onCompareButtonClicked"
        },
        initialize: function () {
            this.listenTo(App.vent, "update:user:profile", this.updateInterface, this);
            this.listenTo(App.vent, "device-network-status-changed", this.onDeviceNetworkStatusChanged, this);
            this.listenTo(App.vent, "changeInUserData", this.onShow, this);
            this.listenTo(App.vent, "barmenu:onCompareButtonClicked", this.onCompareButtonClicked, this);
        },
        onShow: function () {
            this.updateInterface();
            this.$el.find(".username").text(App.userdata.name.length <= 20 ? App.userdata.name : App.userdata.name.substring(0, 17) + "...");
            this.onDeviceNetworkStatusChanged();
        },
        updateInterface: function () {
            var increase = (parseInt(App.request("entities:wpm-increase")) > 0) ? App.request("entities:wpm-increase") : 0;
            var wpm = App.request("entities:best-wpm");
            var f4WPM = App.userdata.f4WPM;
            console.log('Update interface | Increase: ' + increase + ", wpm: " + wpm + ", f4WPM: " + f4WPM);
            this.$el.find(".increase").text(increase);
            this.$el.find(".wpm").text(wpm);
            this.$el.find(".f4-wpm").text(f4WPM);
        },
        lastOnlineStatus: null,
        onDeviceNetworkStatusChanged: function (status) {
            var status = { isOnline: App.isOnline };
            console.log("Device network status: ", status);
            $(".net-work-status").animate({ opacity: status.isOnline ? 0 : 1 }, 150);
            /*
             if(this.lastOnlineStatus !== status.isOnline && status.isOnline) {
             console.log("connected to the internet.. lets save the users progress..")
             Server.saveUserData();
             }
             */
            this.lastOnlineStatus = status;
        },
        onCompareButtonClicked: function () {
            if (App.userdata.tests[0].isComplete) {
                if (App.userdata.tests[1].isComplete || App.userdata.tests[2].isComplete || App.userdata.tests[3].isComplete) {
                    App.vent.trigger("show:compare-speed-window");
                }
            }
        },
    });
    var Controller = Marionette.Controller.extend({
        initialize: function (options) {
            this.region = options.region;
            this.listenTo(App.router, "route", this.checkIfProfileMenuShouldBeVisible);
        },
        create: function () {
            if (this.shouldBeVisible()) {
                if (!this.region.hasOwnProperty("currentView"))
                    this.region.show(new View());
                if (this.region.hasOwnProperty("currentView") && this.region.currentView.isClosed)
                    this.region.show(new View());
            }
            else
                this.region.reset();
        },
        shouldBeVisible: function () {
            var result = false;
            var value = _Backbone.history.getFragment();
            if (value == "" || /t1|t2|t3|t4|workspace|configuration|test|videos|diploma/.test(value))
                result = true;
            return result;
        },
        checkIfProfileMenuShouldBeVisible: function (e) {
            this.create();
        }
    });
    App.addInitializer(function () {
        var controller = new Controller({ region: App.profileMenuRegion });
        controller.create();
    });
});
//# sourceMappingURL=barmenu.show.js.map;
 /***************************/ 
var compareExercise = "";
var t2 = "";
var t3 = "";
var t4 = "";
App.module("CompareSpeed", function (CompareSpeed, App, _Backbone, Marionette, $, _) {
    CompareSpeed.View = Marionette.ItemView.extend({
        template: "user/profile/barmenu/show/compare-speed",
        templateHelpers: {
            getHeadline: function () {
                if (compareExercise == "t2") {
                    return App.translate("compare-headline-congratulations").format(t2);
                }
                else if (compareExercise == "t3") {
                    return App.translate("compare-headline-congratulations").format(t3);
                }
                else if (compareExercise == "t4") {
                    return App.translate("compare-headline-congratulations").format(t4);
                }
                else {
                    return App.translate("compare-headline-neutral");
                }
            },
            getCompareText: function () {
                var text = "";
                var t23final = App.translate("compare-text-final-line-milestone");
                var t4final = App.translate("compare-text-final-line-end-test");
                if (App.currentExercise == "t2") {
                    text = App.translate("compare-text").format(t2, t23final);
                }
                else if (App.currentExercise == "t3") {
                    text = App.translate("compare-text").format(t3, t23final);
                }
                else if (App.currentExercise == "t4") {
                    text = App.translate("compare-text").format(t4, t4final);
                }
                else {
                    if (App.userdata.tests[3].isComplete) {
                        text = App.translate("compare-text").format(t4, t4final);
                    }
                    else if (App.userdata.tests[2].isComplete) {
                        text = App.translate("compare-text").format(t3, t23final);
                    }
                    else {
                        text = App.translate("compare-text").format(t2, t23final);
                    }
                }
                return text;
            },
            getWpm: function (when) {
                var wpmStart = App.userdata.tests[0].wpm;
                var wpmNow = App.request("entities:best-wpm");
                if (when == "Start") {
                    return wpmStart;
                }
                else {
                    return wpmNow;
                }
            }
        },
        ui: {
            "compareContainer": ".compareContainer",
            "accessibilityOverlayer": ".accessibilityOverlayer",
            "text": ".compareBox"
        },
        setf4AsComplete: false,
        events: {
            "click .btnClose": "onCloseClicked"
        },
        myMoveStart: function (scrollerHeight, duration) {
            var elemStart = document.getElementById("compareStart");
            var scrollerRegionStart = document.getElementById("scrollerRegionStart");
            var pos = scrollerRegionStart.scrollHeight - 5; //height of the scrollerRegion element - 5px
            var secPrPix = duration / scrollerHeight;
            console.log("durationStart: " + duration);
            console.log("Height of scroller elem: " + scrollerRegionStart);
            if (secPrPix * 1000 > 80) //If secPrPix is bigger than 0.08, meaning duration is longer than 13.6, meaning the text was read in more than 13.6 seconds
             {
                var id_1 = setInterval(frame2, secPrPix * 500); //Make this value at least 40 (smallest value possible is 10)
                function frame2() {
                    if (pos < -scrollerHeight) { //When all text has passed the screen
                        clearInterval(id_1); //Stop the function
                        App.vent.trigger("scrollingtext:complete"); //Tell the app that the scrolling is complete
                        console.log("Text Done Start If");
                    }
                    else {
                        pos -= 0.5; //Decrement this value by .5 to raise the text by half a pixel
                        elemStart.style.top = pos + 'px';
                    }
                }
            }
            else //If secPrPix is smaller than 0.08, meaning the text was read in less than 13.6 seconds
             {
                var id_2 = setInterval(frame, secPrPix * 1000); //Means that this value goes up to 80 (smallest value possible is 10)
                function frame() {
                    if (pos < -scrollerHeight) {
                        clearInterval(id_2);
                        App.vent.trigger("scrollingtext:complete");
                        console.log("Text Done Start Else");
                    }
                    else {
                        pos--; //And decrement by 1 instead of .5
                        elemStart.style.top = pos + 'px';
                    }
                }
            }
        },
        myMoveNow: function (scrollHeight, duration) {
            var elemNow = document.getElementById("compareNow");
            var pos = 195; //height of the element - 5
            var secPrPix = duration / scrollHeight;
            console.log("durationNow: " + duration);
            if (secPrPix * 1000 > 80) {
                var id_3 = setInterval(frame2, secPrPix * 500);
                function frame2() {
                    if (pos < -scrollHeight) {
                        clearInterval(id_3);
                        App.vent.trigger("scrollingtext:complete");
                        console.log("Text Done Now If");
                    }
                    else {
                        pos -= 0.5;
                        elemNow.style.top = pos + 'px';
                    }
                }
            }
            else {
                var id_4 = setInterval(frame, secPrPix * 1000);
                function frame() {
                    if (pos < -scrollHeight) {
                        clearInterval(id_4);
                        App.vent.trigger("scrollingtext:complete");
                        console.log("Text Done Now Else");
                    }
                    else {
                        pos--;
                        elemNow.style.top = pos + 'px';
                    }
                }
            }
        },
        getReadTimeInSeconds: function (wpm, numWords) {
            return (numWords / wpm) * 60;
        },
        getWordCount: function (text) {
            text = text.replace(/(^\s*)|(\s*$)/gi, "");
            text = text.replace(/[ ]{2,}/gi, " ");
            text = text.replace(/\n /, "\n");
            return text.split(' ').length;
        },
        onCloseClicked: function () {
            App.vent.trigger("close:compare-speed-window");
        },
        onCompareSpeed: function () {
        },
        onScrollintTextComplete: function () {
            console.log("Text Done");
        },
        onBeforeRender: function () {
            var splitURL = Backbone.history.getFragment().split("/").slice(1);
            compareExercise = splitURL[2];
            t2 = App.translate("mellemtest-single") + " 1";
            t3 = App.translate("mellemtest-single") + " 2";
            t4 = App.translate("sluttest-definite");
        },
        onShow: function () {
            var wpmStart = App.userdata.tests[0].wpm;
            var wpmNow = App.request("entities:best-wpm");
            var improvement = App.request("entities:wpm-increase");
            var barStartHeight = 240; //The height of the barStart (hardcoded, becuase it's far too difficult to get the compelete height of the scrollerRegion, including margins)
            var improvementHeight = (barStartHeight * improvement) / 100;
            var lineHeight = 20; //The lineheight of the font
            var barNow = document.getElementById("compareBarNow");
            console.log("improvementHeight: " + improvementHeight);
            if (improvementHeight > barStartHeight) { //If improvement is bigger than 100, make the barNow twice as big as barStart
                barNow.style.height = barStartHeight * 2 + "px";
            }
            else if (improvementHeight > lineHeight) { //If the improvement allows for enough room for both texts on the y-axis, but is not more than double the barStart, make the barheight the proper way
                barNow.style.height = (improvementHeight + barStartHeight) + "px";
            }
            else if (improvement > 0 && improvementHeight <= lineHeight) { //If the improvement does not allow enough room for both texts, raise the orange bar up enough to show both y-axis texts properly
                barNow.style.height = (barStartHeight + lineHeight) + "px";
            }
            else { //If the improvement is 0 lower, make both bars the same height, to show that no progress has been made
                barNow.style.height = barStartHeight + "px";
            }
            var xAxis = document.getElementById("xAxisCompare");
            var yAxis = document.getElementById("yAxisCompare");
            yAxis.style.height = (barNow.clientHeight + (xAxis.clientHeight / 2) + 20) + "px"; //Have the y-axis be the same height as the heighest bar + half the height of the x-axis + the line height of body, to raise the top point on the line. 
            //This way the y- and x-axis overlap and the upper text of the y-axis is as high up as top of the heighest bar
            var yAxisText = document.getElementById("yAxisText");
            yAxisText.style.height = (barNow.clientHeight + (xAxis.clientHeight / 2) + 20) + "px"; //The same as yAxis
            var yAxisTextStart = document.getElementById("yAxisTextStart");
            yAxisTextStart.style.marginTop = (barNow.clientHeight - barStartHeight - lineHeight) + "px"; //Set the height of the text on the y-axis
            var yAxisTickStart = document.getElementById("yAxisTickStart");
            yAxisTickStart.style.marginTop = (barNow.clientHeight - barStartHeight - lineHeight) + "px"; //set the height of the tick on the y-axis
            var compareText = this.templateHelpers.getCompareText();
            var wordCount = this.getWordCount(compareText);
            console.log("wordCount: " + wordCount);
            var scrollHeight = this.ui.compareContainer.get(0).scrollHeight - this.ui.text.position().top;
            var durationStart = (wordCount / wpmStart) * 60; //Get the duration in seconds
            var durationNow = (wordCount / wpmNow) * 60; //Get the duration in seconds
            console.log("start");
            console.log("wpmNow: " + wpmNow + " | wpmStart: " + wpmStart);
            this.myMoveStart(scrollHeight, durationStart);
            this.myMoveNow(scrollHeight, durationNow);
            this.listenTo(App.vent, "scrollingtext:complete", this.onScrollintTextComplete, this);
        },
        onClose: function () {
        }
    });
    var Controller = {
        show: function () {
            $(App.utilPopupRegion.el).removeClass("display-none");
            App.utilPopupRegion.show(new CompareSpeed.View());
        },
        close: function () {
            $(App.utilPopupRegion.el).addClass("display-none");
            App.utilPopupRegion.reset();
        }
    };
    App.addInitializer(function () {
        App.vent.on("show:compare-speed-window", Controller.show);
        App.vent.on("close:compare-speed-window", Controller.close);
    });
});
//# sourceMappingURL=compare-speed.js.map