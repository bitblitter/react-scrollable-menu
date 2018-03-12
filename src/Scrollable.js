import React, { Component } from "react";
import ReactDOM from "react-dom";
import { easeInOutQuart } from "./easing";
import "./scrollable.css";
import Animator from "./Animator";

export default class Scrollable extends React.Component {
  constructor(props) {
    super(props);
    this.scrollTimeout = null;
    this.state = {
      overflow: "none",
      mouseDown: false,
      lastClientX: 0,
      lastClientY: 0,
      deltaX: 0,
      deltaY: 0,
      scroll: 0
    };
    this.childrenRefs = [];
    this.scrollAnimator = new Animator();
    this.onScroll = this._onScroll.bind(this);
    this.updateOverflow = this._updateOverflow.bind(this);
    this.onMouseMove = this._onMouseMove.bind(this);
    this.onMouseDown = this._onMouseDown.bind(this);
    this.onMouseUp = this._onMouseUp.bind(this);
    this.onMouseOut = this._onMouseOut.bind(this);
    this.scrollTo = this.scrollTo.bind(this);
    this.scrollToNext = this.scrollToNext.bind(this);
    this.scrollToPrev = this.scrollToPrev.bind(this);
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mouseout", this.onMouseOut);
  }

  componentDidMount() {
    window.addEventListener("mouseout", this.onMouseOut, true);
    window.addEventListener("mouseup", this.onMouseUp, true);
    this.updateOverflow();
  }

  componentDidUpdate() {
    let scrollLeft = this.container.scrollLeft;
    const { mouseDown, scroll } = this.state;
    this.contents.scrollLeft = scroll;
  }

  componentWillReceiveProps(props, newProps) {
    const { centerOn: centerOnPrev = null } = props;
    const { centerOn: centerOnNew = null } = props;
    this.scrollToCenterOnIndex(centerOnNew);
  }

  /**
   * Scroll handler
   */
  _onScroll() {
    if (this.state.mouseDown) {
      this.scrollAnimator.stopAnimation();
      this.setState({ scroll: this.contents.scrollLeft });
    }
    this.updateOverflow();
  }

  /**
   * Update overflow state variable
   */
  _updateOverflow() {
    const { overflow } = this.state;
    let newOverflow = this.getOverflow();
    if (newOverflow !== overflow) {
      this.setState({ overflow: this.getOverflow() });
    }
  }

  /**
   * Halt dragging when primary mouse button is released.
   */
  _onMouseUp(e) {
    e.preventDefault();
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = null;
    this.setState({ mouseDown: false, scrolling: false });
  }

  /**
   * Halt dragging when mouse is moved outside the window area.
   */
  _onMouseOut(e) {
    e.preventDefault();
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = null;

    if (e.toElement === null || e.relatedTarget === null) {
      this.setState({ mouseDown: false, scrolling: false });
    }
  }

  /**
   * MouseDown Handler.
   */
  _onMouseDown(e) {
    e.preventDefault();
    this.setState({
      mouseDown: true,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      deltaX: 0,
      deltaY: 0,
      scroll: this.contents.scrollLeft
    });
  }

  /**
   * Mouse Move Handler
   */
  _onMouseMove(e) {
    const { mouseDown, lastClientX, lastClientY } = this.state;
    if (!mouseDown) return;
    const deltaX = e.clientX - lastClientX;
    const deltaY = e.clientY - lastClientY;
    this.setState({
      deltaX: deltaX,
      deltaY: deltaY,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      scroll: this.state.scroll - deltaX
    });
    if (!this.scrollTimeout && Math.abs(deltaX) < 30) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        this.setState({
          scrolling: true
        });
      }, 200);
    } else if (Math.abs(deltaX) >= 30 && !this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = true;
      this.setState({
        scrolling: true
      });
    }
  }

  /**
   * Get scroll info:
   * - scroll, scrollWidth, clientWidth, maxScroll
   */
  getScrollData() {
    return {
      scroll: this.contents.scrollLeft,
      scrollWidth: this.contents.scrollWidth,
      clientWidth: this.contents.clientWidth,
      maxScroll: this.contents.scrollWidth - this.contents.clientWidth
    };
  }

  /**
   * Get overflow sides as string (none, left, right or both)
   */
  getOverflow() {
    const { scroll, maxScroll } = this.getScrollData();

    if (scroll > 0 && scroll < maxScroll) {
      return "both";
    } else if (scroll > 0) {
      return "left";
    } else if (scroll < maxScroll) {
      return "right";
    } else {
      return "none";
    }
  }

  /**
   * Scroll contents by fixed amount in px.
   */
  scrollBy(amount) {
    const { scroll } = this.state;
    this.scrollTo(scroll + amount);
  }

  /**
   * Scroll to the position of an element.
   */
  scrollToElement(element) {
    const {
      scroll,
      maxScroll,
      scrollWidth,
      clientWidth
    } = this.getScrollData();
    const scrollTarget = element.offsetLeft;
    this.scrollTo(scrollTarget);
  }

  scrollToCenterOnIndex(index) {
    if (this.childrenRefs.hasOwnProperty(index)) {
      const element = this.childrenRefs[index];
      this.scrollToCenterOn(element);
    }
  }

  /**
   * Scroll to show the element on the center (if posssible)
   */
  scrollToCenterOn(element) {
    const { scroll, clientWidth } = this.getScrollData();
    const leftBound = scroll;
    const rightBound = scroll + clientWidth;
    const ofw = (element.offsetWidth - clientWidth) / 2;
    const centeredPos = element.offsetLeft + ofw;
    this.scrollTo(centeredPos);
  }

  /**
   * Scroll to make an element visible.
   */
  scrollToView(element, offset = 0) {
    const { scroll, clientWidth } = this.getScrollData();
    const leftBound = scroll;
    const rightBound = scroll + clientWidth;
    if (element.offsetLeft < leftBound) {
      this.scrollTo(element.offsetLeft);
    } else if (element.offsetLeft + element.offsetWidth > rightBound) {
      const delta = element.offsetLeft + element.offsetWidth - rightBound;
      this.scrollTo(leftBound + delta + offset);
    }
  }

  /**
   * Scroll to make the next element on the right fully visible.
   */
  scrollToNext() {
    const nextItem = this.getNextScrollableChildren();
    if (nextItem) {
      this.scrollToView(nextItem, 20);
    }
  }

  /**
   * Scroll to make the next element on the left fully visible.
   */
  scrollToPrev() {
    const prevItem = this.getPrevScrollableChildren();
    if (prevItem) {
      this.scrollToView(prevItem, -20);
    }
  }

  /**
   * Scroll contents to position in px.
   */
  scrollTo(value) {
    if (!this.contents) return;
    const { scroll } = this.state;
    const { animTime = 0.3, easing = easeInOutQuart } = this.props;
    this.scrollAnimator.animate({
      from: scroll,
      to: value,
      time: animTime,
      callback: value => {
        this.setState({ scroll: value });
      },
      easing: easing
    });
  }

  /**
   * get container classes
   */
  getContainerClasses() {
    const { overflow } = this.state;
    let classes = ["scrollable"];
  }

  /**
   * Get the next not fully visible element on the right.
   */
  getNextScrollableChildren() {
    const {
      scroll,
      maxScroll,
      scrollWidth,
      clientWidth
    } = this.getScrollData();
    const leftBound = scroll;
    const rightBound = scroll + clientWidth;
    const nextItem = this.childrenRefs.find(element => {
      const node = ReactDOM.findDOMNode(element);
      return node.offsetLeft + node.offsetWidth > rightBound;
    });
    return nextItem;
  }

  /**
   * Get the next not fully visible element on the left.
   */
  getPrevScrollableChildren() {
    const {
      scroll,
      maxScroll,
      scrollWidth,
      clientWidth
    } = this.getScrollData();

    const leftBound = scroll;
    let childrenRefsReversed = this.childrenRefs.reverse();
    const prevItem = childrenRefsReversed.find(element => {
      const node = ReactDOM.findDOMNode(element);
      return node.offsetLeft < leftBound;
    });
    return prevItem;
  }

  render() {
    const { children, style = {}, showOverflowIndicators = true } = this.props;
    const { overflow, scrolling, scroll } = this.state;
    let containerClasses = ["scrollable", "overflow-" + overflow];
    if (scrolling) {
      containerClasses.push("scrolling");
    }
    return (
      <div
        className={containerClasses.join(" ")}
        style={style}
        ref={container => {
          this.container = container;
        }}
      >
        {showOverflowIndicators ? (
          <div className="overflow-indicator left" onClick={this.scrollToPrev}>
            &lt;
          </div>
        ) : null}
        <div className="contents-container">
          <div
            className="contents"
            ref={contents => {
              this.contents = contents;
            }}
            onScroll={this.onScroll}
            onMouseDown={this.onMouseDown}
            onMouseMove={this.onMouseMove}
          >
            <div
              ref={contentsInner => {
                this.contentsInner = contentsInner;
              }}
              className="contents-inner"
            >
              {React.Children.map(children, (element, idx) => {
                return React.cloneElement(element, {
                  ref: element => {
                    this.childrenRefs[idx] = element;
                    return idx;
                  }
                });
              })}
            </div>
          </div>
        </div>
        {showOverflowIndicators ? (
          <div
            className="overflow-indicator right"
            onClick={() => {
              this.scrollToNext();
            }}
          >
            &gt;
          </div>
        ) : null}
      </div>
    );
  }
}
