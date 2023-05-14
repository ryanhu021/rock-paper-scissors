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

export default function Home() {
  const [play, setPlay] = useState(false);
  const predictionRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState("");
  const [message, setMessage] = React.useState("");
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
          setMessage("");
        }
      }, 1000);
    });
    socket.on("choice", (msg) => {
      setStatus(msg);
    });
    socket.on("result", (msg) => {
      setStatus(msg);
      socket.disconnect();
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
        {play ? (
          <Play predictionRef={predictionRef} />
        ) : (
          <Button variant="primary" onClick={handlePlay}>
            Play
          </Button>
        )}
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
