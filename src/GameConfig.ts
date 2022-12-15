/*
* 游戏初始化配置;
*/
export default class GameConfig{
    static width:number=1024;
    static height:number=1024;
    static scaleMode:string=Laya.Stage.SCALE_FIXED_AUTO;
    static screenMode:string="none";
    static alignV:string="top";
    static alignH:string="left";
    static startScene:any="";
    static sceneRoot:string="";
    static debug:boolean=false;
    static stat:boolean=false;
    static physicsDebug:boolean=false;
    static exportSceneToJson:boolean=true;
    constructor(){}
    static init(){
        var reg: Function = Laya.ClassUtils.regClass;
    }
}
GameConfig.init();