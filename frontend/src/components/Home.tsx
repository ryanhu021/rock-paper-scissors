import styled from "styled-components";
import { Button } from "react-bootstrap";
import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import Play from "./Play";

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
`;

// make div fill remaining height
const CenterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  width: 100%;
  height: 100%;
`;

const ImagesContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

export default function Home() {
  const [play, setPlay] = useState(false);
  const predictionRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState("");
  const [message, setMessage] = React.useState("");
  const opponentRef = useRef<HTMLImageElement>(null);

  const socket = io(process.env.REACT_APP_SERVER_URL!, { autoConnect: false });

  const handlePlay = () => {
    socket.connect();
  };

  const handleReset = () => {
    socket.disconnect();
    setPlay(false);
    setStatus("");
    setMessage("");
  };

  useEffect(() => {
    socket.on("player", (msg) => {
      setStatus(msg);
      setPlay(true);
    });
    socket.on("countdown", (msg) => {
      setStatus(msg);
    });
    socket.on("start", (msg) => {
      setStatus(msg);
      // count down from 3 and send prediction
      let count = 3;
      const interval = setInterval(() => {
        setMessage(count.toString());
        console.log(count);
        count--;
        if (count === -1) {
          clearInterval(interval);
          socket.emit("choice", predictionRef.current!.innerHTML.toLowerCase());
          const canvas = document.getElementsByTagName("canvas")[0]!;
          socket.emit("image", canvas.toDataURL());
          setMessage("");
        }
      }, 1000);
    });
    socket.on("choice", (msg) => {
      setStatus(msg);
    });
    socket.on("result", (msg) => {
      setStatus(msg);
      setTimeout(() => {
        socket.disconnect();
      }, 10000);
    });
    socket.on("image", (msg) => {
      opponentRef.current!.src = msg;
      opponentRef.current!.width = 400;
      opponentRef.current!.height = 400;
      opponentRef.current!.style.marginLeft = "16px";
      opponentRef.current!.style.marginBottom = "29.6px";
    });
    socket.on("error", (msg) => {
      setMessage(msg);
      setPlay(false);
      socket.disconnect();
    });
  }, []);

  return (
    <StyledContainer>
      <h1>Rock Paper Scissors</h1>
      <CenterContainer>
        <h3>{status}</h3>
        <br />
        <ImagesContainer>
          {play ? (
            <Play predictionRef={predictionRef} />
          ) : (
            <Button variant="primary" onClick={handlePlay}>
              Play
            </Button>
          )}
          <img ref={opponentRef} alt="opponent" width={0} height={0} />
        </ImagesContainer>
        {message && <h3>{message}</h3>}
        <br />
        {play && (
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        )}
        <br />
      </CenterContainer>
    </StyledContainer>
  );
}
