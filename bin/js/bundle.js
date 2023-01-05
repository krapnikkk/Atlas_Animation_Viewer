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
      let fileCnt = 0;
      console.log(files);
      for (let i = 0; i < files.length; i++) {
        fileCnt++;
        let file = files[i];
        let name = file.name;
        let nameArr = name.split(".");
        nameArr.pop();
        let fileName = nameArr.join(".");
        if (typeof this.assetsMap[fileName] == "undefined") {
          this.assetsMap[fileName] = Object.create({});
        }
        let ext = Laya.Loader.getTypeFromUrl(name);
        if (ext == Laya.Loader.ATLAS || ext == Laya.Loader.JSON) {
          this.assetsMap[fileName]["atlas"] = file;
        } else if (ext == Laya.Loader.IMAGE) {
          this.assetsMap[fileName]["image"] = file;
        } else {
          alert("\u53D1\u73B0\u65E0\u6548\u7684\u52A8\u753B\u56FE\u96C6\u6216\u63CF\u8FF0\u6587\u4EF6\uFF0C\u8BF7\u68C0\u67E5\u6587\u4EF6\u662F\u5426\u6709\u8BEF\uFF01");
        }
      }
      if (fileCnt == 0 && fileCnt % 2 !== 0) {
        alert("\u672A\u53D1\u73B0\u6709\u6548\u7684\u8D44\u6E90\u6587\u4EF6\u6216\u8005\u7F3A\u5C11\u6210\u5BF9\u7684\u8D44\u6E90\u6587\u4EF6\uFF01");
      } else {
        EventDispatcher.event(Events.UPLOAD_SUCCESS, this.assetsMap);
      }
    }
    static handleFile(key) {
      let assets = this.assetsMap[key];
      let image = assets["image"];
      let atlas = assets["atlas"];
      let blob = new Blob([image], { type: image.type });
      let imageUrl = URL.createObjectURL(blob);
      Laya.loader.load([
        { url: imageUrl, type: Laya.Loader.IMAGE }
      ], Laya.Handler.create(this, () => {
        Laya.Loader.loadedMap[`blob:${location.origin}/${image.name}`] = Laya.Loader.textureMap[imageUrl];
        let reader = new FileReader();
        reader.readAsText(atlas);
        reader.onload = (e) => {
          let json = JSON.parse(e.target.result);
          json.meta.image = imageUrl.replace(`blob:${location.origin}/`, "");
          let blob2 = new Blob([JSON.stringify(json)], { type: atlas.type });
          let atlasUrl = URL.createObjectURL(blob2);
          Laya.loader.load([
            { url: atlasUrl, type: Laya.Loader.ATLAS }
          ], Laya.Handler.create(this, () => {
            EventDispatcher.event(Events.SHOW_VIEW, atlasUrl);
            URL.revokeObjectURL(atlasUrl);
            URL.revokeObjectURL(imageUrl);
          }));
        };
      }));
    }
  };
  FileParser.assetsMap = {};

  // src/GViewerPanel.ts
  var GViewerPanel = class extends fgui.GComponent {
    constructor() {
      super();
    }
    onConstruct() {
      super.onConstruct();
      this.init();
    }
    init() {
      this.g_tips = this.getChild("g_tips");
    }
    onShowAnimations() {
      this.g_tips.visible = false;
    }
  };

  // src/Viewer.ts
  var options = {
    fps: 12,
    idx: 0
  };
  var Viewer = class {
    constructor() {
      this.initView();
      this.bindEvent();
    }
    initView() {
      this.viewer = fgui.UIPackage.createObject("Viewer", "Main");
      fgui.GRoot.inst.addChild(this.viewer);
      fgui.GRoot.inst.setSize(Laya.stage.width, Laya.stage.height);
      Laya.stage.addChild(fgui.GRoot.inst.displayObject);
      this.animation = Laya.Pool.getItemByClass("Animation", Laya.Animation);
      this.viewer.displayObject.addChild(this.animation);
      this.viewer.setSize(Laya.stage.width, Laya.stage.height);
      this.initInspector();
    }
    initInspector() {
      this.gui = new window["dat"].GUI({ name: "Inspector" });
      let FPS = [12, 24, 30, 48, 60];
      this.gui.add(options, "fps", FPS).name("\u5E27\u9891").onChange((val) => {
        options.fps = val;
        this.animation.interval = 1e3 / val;
      });
      this.filesFloder = this.gui.addFolder("Files");
    }
    bindEvent() {
      EventDispatcher.on(Events.SHOW_VIEW, this, this.showAnimation);
      EventDispatcher.on(Events.UPLOAD_SUCCESS, this, this.onLoaded);
    }
    onLoaded(data) {
      this.viewer.onShowAnimations();
      if (this.filesFloder) {
        this.gui.removeFolder(this.filesFloder);
      }
      this.filesFloder = this.gui.addFolder("Files");
      this.filesFloder.add(options, "idx", Object.keys(data)).name("\u6587\u4EF6\u5217\u8868").onChange((val) => {
        FileParser.handleFile(val);
      });
      FileParser.handleFile(Object.keys(data)[0]);
      this.filesFloder.open();
    }
    showAnimation(atlas) {
      this.animation.loadAtlas(atlas, Laya.Handler.create(this, this.onAtlasLoaded));
    }
    onAtlasLoaded() {
      this.animation.interval = 1e3 / options.fps;
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
      this.initConfig();
      this.loadResource();
      this.initDropEvent();
    }
    initConfig() {
      fgui.UIObjectFactory.setExtension("ui://Viewer/Main", GViewerPanel);
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
