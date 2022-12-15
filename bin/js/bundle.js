var polea = (() => {
  // src/EventDispatcher.ts
  var _EventDispatcher = class extends Laya.EventDispatcher {
    constructor() {
      super();
    }
    static get instance() {
      if (!this._instance) {
        this._instance = new _EventDispatcher();
      }
      return this._instance;
    }
    static event(type, data) {
      return this.instance.event(type.toString(), data);
    }
    static on(type, caller, listener, args) {
      return this.instance.on(type.toString(), caller, listener, args);
    }
    static once(type, caller, listener, args) {
      return this.instance.once(type.toString(), caller, listener, args);
    }
    static off(type, caller, listener, onceOnly) {
      return this.instance.off(type.toString(), caller, listener, onceOnly);
    }
    static offAll(type) {
      return this.instance.offAll(type.toString());
    }
  };
  var EventDispatcher = _EventDispatcher;
  EventDispatcher._instance = null;

  // src/Events.ts
  var Events = class {
  };
  Events.UPLOAD_SUCCESS = "upload_success";
  Events.SHOW_VIEW = "show_view";
  Events.UPDATE_VIEW = "update_view";
  Events.DELETE_VIEW = "delete_view";
  Events.SHOW_LIST = "show_list";
  Events.HIDE_LIST = "hide_list";
  Events.INIT_LIST = "init_list";
  Events.EMIT_UPLOAD = "emit_upload";

  // src/FileParser.ts
  var FileParser = class {
    static parseFile(files) {
      let atlas, image;
      let imageName = "", hasImport = false;
      let urls = [];
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let name = file.name;
        let type = file.type;
        let ext = Laya.Loader.getTypeFromUrl(name);
        if (ext == Laya.Loader.ATLAS || ext == Laya.Loader.JSON) {
          atlas = file;
        } else if (ext == Laya.Loader.IMAGE) {
          let blob = new Blob([file], { type });
          let url = URL.createObjectURL(blob);
          urls.push(url);
          image = url;
          imageName = name;
        }
      }
      if (urls.length == 0 && !hasImport) {
        alert("\u672A\u53D1\u73B0\u6709\u6548\u7684\u8D44\u6E90\u6587\u4EF6\uFF01");
      } else {
        if (!atlas || !image) {
          alert("\u672A\u53D1\u73B0\u6709\u6548\u7684\u52A8\u753B\u56FE\u96C6\u6216\u63CF\u8FF0\u6587\u4EF6\uFF01");
        } else {
          Laya.loader.load([
            { url: image, type: Laya.Loader.IMAGE }
          ], Laya.Handler.create(this, () => {
            Laya.Loader.loadedMap[`blob:${location.origin}/${imageName}`] = Laya.Loader.textureMap[image];
            let reader = new FileReader();
            reader.readAsText(atlas);
            reader.onload = (e) => {
              let json = JSON.parse(e.target.result);
              json.meta.image = image.replace(`blob:${location.origin}/`, "");
              let blob = new Blob([JSON.stringify(json)], { type: atlas.type });
              let url = URL.createObjectURL(blob);
              Laya.loader.load([
                { url, type: Laya.Loader.ATLAS }
              ], Laya.Handler.create(this, () => {
                EventDispatcher.event(Events.UPLOAD_SUCCESS, url);
                URL.revokeObjectURL(url);
                urls.forEach((url2) => {
                  URL.revokeObjectURL(url2);
                });
              }));
            };
          }));
        }
      }
    }
  };

  // src/Viewer.ts
  var Viewer = class {
    constructor() {
      this.initView();
      this.bindEvent();
    }
    initView() {
      this.view = fgui.UIPackage.createObject("Viewer", "Main");
      fgui.GRoot.inst.addChild(this.view);
      fgui.GRoot.inst.setSize(Laya.stage.width, Laya.stage.height);
      Laya.stage.addChild(fgui.GRoot.inst.displayObject);
      this.animation = Laya.Pool.getItemByClass("Animation", Laya.Animation);
      this.view.displayObject.addChild(this.animation);
      this.view.setSize(Laya.stage.width, Laya.stage.height);
    }
    bindEvent() {
      EventDispatcher.on(Events.UPLOAD_SUCCESS, this, this.showAnimations);
    }
    showAnimations(atlas) {
      this.animation.loadAtlas(atlas, Laya.Handler.create(this, this.onAtlasLoaded));
    }
    onAtlasLoaded() {
      this.animation.interval = 1e3 / 12;
      this.animation.play();
      let bounds = this.animation.getGraphicBounds();
      this.animation.pivot(bounds.width / 2, bounds.height / 2);
      this.animation.pos(Laya.stage.width / 2, Laya.stage.height / 2);
    }
  };

  // src/App.ts
  var App = class {
    constructor() {
      this.init();
    }
    init() {
      this.loadResource();
      this.initDropEvent();
    }
    loadResource() {
      fgui.UIPackage.loadPackage("res/ui/Viewer", Laya.Handler.create(this, this.onResLoaded));
    }
    onResLoaded() {
      new Viewer();
    }
    initDropEvent() {
      let canvas = document.querySelector("#layaCanvas");
      canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        let dataTransfer = e.dataTransfer;
        if (dataTransfer.items !== void 0) {
          let dataTransferItemList = dataTransfer.items;
          let files = [];
          for (let i = 0; i < dataTransferItemList.length; i++) {
            let item = dataTransferItemList[i];
            if (item.kind === "file" && item.webkitGetAsEntry().isFile) {
              let file = item.getAsFile();
              files.push(file);
            }
          }
          FileParser.parseFile(files);
        }
      });
      canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
      });
    }
    createFileInput() {
      this.fileInput = document.createElement("input");
      this.fileInput.type = "file";
      this.fileInput.style.display = "none";
      this.fileInput.multiple = true;
      this.fileInput.addEventListener("change", () => {
        if (!this.fileInput.value) {
          return;
        }
        let files = this.fileInput.files;
        FileParser.parseFile(files);
        this.fileInput.value = "";
      });
    }
  };

  // src/GameConfig.ts
  var GameConfig = class {
    constructor() {
    }
    static init() {
      var reg = Laya.ClassUtils.regClass;
    }
  };
  GameConfig.width = 1024;
  GameConfig.height = 1024;
  GameConfig.scaleMode = Laya.Stage.SCALE_FIXED_AUTO;
  GameConfig.screenMode = "none";
  GameConfig.alignV = "top";
  GameConfig.alignH = "left";
  GameConfig.startScene = "";
  GameConfig.sceneRoot = "";
  GameConfig.debug = false;
  GameConfig.stat = false;
  GameConfig.physicsDebug = false;
  GameConfig.exportSceneToJson = true;
  GameConfig.init();

  // src/Main.ts
  var Main = class {
    constructor() {
      if (window["Laya3D"])
        Laya3D.init(GameConfig.width, GameConfig.height);
      else
        Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
      Laya["Physics"] && Laya["Physics"].enable();
      Laya["DebugPanel"] && Laya["DebugPanel"].enable();
      Laya.stage.scaleMode = GameConfig.scaleMode;
      Laya.stage.screenMode = GameConfig.screenMode;
      Laya.stage.alignV = GameConfig.alignV;
      Laya.stage.alignH = GameConfig.alignH;
      Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
      if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
        Laya.enableDebugPanel();
      if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
        Laya["PhysicsDebugDraw"].enable();
      if (GameConfig.stat)
        Laya.Stat.show();
      new App();
    }
    onVersionLoaded() {
    }
    onConfigLoaded() {
    }
  };
  new Main();
})();
//# sourceMappingURL=bundle.js.map
