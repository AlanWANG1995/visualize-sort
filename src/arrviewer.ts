import { CanvasSpace, Pt, Group, CanvasForm, Space } from "pts";
import { Arr, BasicArr, ArrEventDetail } from "./arr";
import { MusicBox } from "./musicbox";

interface InfoObject{
  frame_count: number,
  frame_diff: number
}
export class ArrViewer{
  private space: CanvasSpace;
  private form: CanvasForm;
  private arr: Arr;

  private _arr: Array<number>;
  private eventArray: Array<ArrEventDetail> = new Array();
  private _lastAccess = -1;
  private _lastSet = -1;
  private clean = false;
  private frame_count = 0;
  private last_time = 0;
  private _lastMoveRange?: Array<number> = null;

  private mb = new MusicBox();

  /**
   *
   * @param id `<div>` element's id
   * @param arr `Arr` instance
   */
  constructor(id: String, arr: Arr = new BasicArr()){
    this.space = new CanvasSpace("#"+id);
    this.space.setup({resize: true, retina: true, bgcolor: "#000"});
    this.form = this.space.getForm();
    this.arr = arr;

    //get a copy of the init arr.
    this._arr = this.arr.arr.slice();

    //add event listener to `arr-access` event.
    addEventListener("arr-access", (e:CustomEvent<ArrEventDetail>)=>{
      this.eventArray.push(e.detail);
    });
  }

  //process events in eventArr
  process(e: ArrEventDetail){
    if(!e) return;
    switch (e.type) {
      case 0:
        this._lastAccess = e.index;
        this.clean = e.value === 1;
        this.mb.createSound(this._arr[e.index] * 0.8 + 587);
        break;
      case 1:
        this._lastSet = e.index;
        this._arr[e.index] = e.value;
        this.mb.createSound(this._arr[e.index] * 0.8 + 587);
        break;
      case 2:
        let temp = this._arr[e.value];
        for(let i=e.value; i>e.index; i--){
          this._arr[i] = this._arr[i-1];
        }
        this._lastSet = e.index;
        this._lastMoveRange = [e.index, e.value];
        this._arr[e.index] = temp;
        this.frame_count += (e.value - e.index);
        for(let i = e.index; i<= e.value; i++){
          this.mb.createSound(this._arr[i] * 0.8 + 587);
        }
        break;
      default:
        break;
    }

  }

  /**
   *
   * @param delay Time duration between each frame.
   */
  show(delay=1, frame_gap=1) {
    this.arr.begin();
    const w = 1600 / this.arr.size;
    this.space.add((time, ftime)=>{
      let frame_diff = 0;
      if(time - this.last_time > delay && this.eventArray.length > 0){
        frame_diff = time - this.last_time;
        this.last_time = time;
        for(let i = 0; i < frame_gap; i++){
          this.process(this.eventArray.shift());
          if(!this.clean) this.frame_count ++;
        }
      }
      this.form.fill("#f88").text([10, 50], this.info({frame_count: this.frame_count, frame_diff: frame_diff}));

      for(let i = 0; i< this.arr.size; i++){
        const tl = new Pt(w*i, 900);
        const br = new Pt(w*i+w, (450-this._arr[i]) * 2);
        this.form.fill(this.colorOf(i)).rect([tl, br]);
      }
      if(this._lastMoveRange) this._lastMoveRange = null;
    });
    this.space.play();
  }

  info(i: InfoObject):string{
    let res = new Array<string>();
    res.push("Array Access: " + i.frame_count);
    if(i.frame_diff > 0){
      res.push("Frame Diff: " + i.frame_diff.toFixed(2))
      res.push("FPS: " + Math.floor(1000/ i.frame_diff));
    };
    return res.join("  ");
  }

  colorOf(i: number): string{
    if(this.clean){
      return i<=this._lastAccess? "#282": "#888";
    } else if(this._lastMoveRange && i > this._lastMoveRange[0] && i<= this._lastMoveRange[1]){
      return "#683";
    }else{
      return i == this._lastAccess?"#822":(this._lastSet==i)?"#248":"#888";
    }
  }
}