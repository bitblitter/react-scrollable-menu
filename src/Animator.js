import { easeInOutQuart } from "./easing";

export default class Animator {
  constructor() {
    this.animRef = null;
  }

  animate({
    from = 0,
    to = 1,
    time = 1,
    easing = easeInOutQuart,
    callback = ({ delta, value }) => {}
  }) {
    this.stopAnimation();
    let value = from;
    const timeMs = time * 1000;
    const iTime = new Date().getTime();
    const diffValue = to - from;
    const anim = () => {
      const cTime = new Date().getTime() - iTime;
      value = easing(cTime, from, diffValue, timeMs);
      if (cTime <= timeMs) {
        this.animRef = requestAnimationFrame(anim);
        callback(value);
      } else {
        this.stopAnimation();
      }
    };
    this.animRef = requestAnimationFrame(anim);
  }

  stopAnimation() {
    if (this.animRef !== null) {
      cancelAnimationFrame(this.animRef);
    }
  }
}
