import EventDispatcher from "./EventDispatcher";
import Events from "./Events";

export default class Viewer{
    constructor(){
        this.initView();
        this.bindEvent();
    }

    view:fgui.GObject;
    animation:Laya.Animation;
    initView(){
        this.view = fgui.UIPackage.createObject("Viewer","Main");
		fgui.GRoot.inst.addChild(this.view);
        fgui.GRoot.inst.setSize(Laya.stage.width,Laya.stage.height);
		Laya.stage.addChild(fgui.GRoot.inst.displayObject);
        this.animation = Laya.Pool.getItemByClass("Animation", Laya.Animation)
        this.view.displayObject.addChild(this.animation);
        this.view.setSize(Laya.stage.width,Laya.stage.height);
    }

    bindEvent(){
        EventDispatcher.on(Events.UPLOAD_SUCCESS,this,this.showAnimations);
    }

    showAnimations(atlas:string){
        this.animation.loadAtlas(atlas,Laya.Handler.create(this,this.onAtlasLoaded));
    }
    
    onAtlasLoaded(){
        this.animation.interval = 1000/12;			// 设置播放间隔（单位：毫秒）
        this.animation.play();

        // 获取动画的边界信息
        let bounds = this.animation.getGraphicBounds();
        this.animation.pivot(bounds.width / 2, bounds.height / 2);
        this.animation.pos(Laya.stage.width/2, Laya.stage.height/2);
    }
    
}