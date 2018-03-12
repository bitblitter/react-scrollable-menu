import React, { Component } from "react";
import { render } from "react-dom";
import Scrollable from "./Scrollable";
import * as Easing from "./easing";

const styles = {
  fontFamily: "sans-serif",
  textAlign: "left",
  background: "#CCC",
  minHeight: "100vh"
};

const ease = Easing.easeOutBack;
const text =
  "Todas,Baby&Kids,Hombre,Mujer,Home&Decor,Remates,Electrónica,Accesorios,Ideas para regalos";
const words = text.split(",");

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeElement: null
    };
  }

  render() {
    const { activeElement } = this.state;
    return (
      <div style={styles}>
        <Scrollable
          centerOn={activeElement}
          showOverflowIndicators={true}
          animTime={0.5}
          easing={ease}
        >
          {words.map((word, index) => {
            const key = "link" + word;
            const buttonClasses =
              "button " + (activeElement === index ? "active" : "");
            return (
              <a
                key={key}
                className={buttonClasses}
                onClick={() => {
                  this.setState({
                    activeElement: index
                  });
                }}
              >
                {word}
              </a>
            );
          })}
        </Scrollable>
        <div />
      </div>
    );
  }
}

render(<App />, document.getElementById("root"));
