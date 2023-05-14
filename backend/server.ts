import dotenv from "dotenv";
import http from "http";
import { Server, Socket } from "socket.io";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let playerOne: Socket | null = null;
let playerTwo: Socket | null = null;

let playerOneChoice: string | null = null;
let playerTwoChoice: string | null = null;

io.on("connection", (socket: Socket) => {
  const checkResults = () => {
    console.log(`Player One choice: ${playerOneChoice}`);
    console.log(`Player Two choice: ${playerTwoChoice}`);
    if (playerOneChoice && playerTwoChoice) {
      if (playerOneChoice === playerTwoChoice) {
        io.emit("result", `It's a tie! Both players chose ${playerOneChoice}`);
      } else if (
        playerOneChoice !== "rock" &&
        playerOneChoice !== "paper" &&
        playerOneChoice !== "scissors"
      ) {
        playerOne?.emit("result", `You lose! Invalid choice!`);
        playerTwo?.emit(
          "result",
          `You win! Player One made an invalid choice!`
        );
      } else if (
        playerTwoChoice !== "rock" &&
        playerTwoChoice !== "paper" &&
        playerTwoChoice !== "scissors"
      ) {
        playerTwo?.emit("result", `You lose! Invalid choice!`);
        playerOne?.emit(
          "result",
          `You win! Player Two made an invalid choice!`
        );
      } else if (
        (playerOneChoice === "rock" && playerTwoChoice === "scissors") ||
        (playerOneChoice === "paper" && playerTwoChoice === "rock") ||
        (playerOneChoice === "scissors" && playerTwoChoice === "paper")
      ) {
        playerOne?.emit(
          "result",
          `You win! ${playerOneChoice} beats ${playerTwoChoice}`
        );
        playerTwo?.emit(
          "result",
          `You lose! ${playerOneChoice} beats ${playerTwoChoice}`
        );
      } else {
        playerTwo?.emit(
          "result",
          `You win! ${playerTwoChoice} beats ${playerOneChoice}`
        );
        playerOne?.emit(
          "result",
          `You lose! ${playerTwoChoice} beats ${playerOneChoice}`
        );
      }
    }
  };

  const onChoice = (choice: string) => {
    if (playerOne === socket) {
      playerOneChoice = choice;
      playerOne.emit("choice", `You chose ${choice}`);
      console.log(`Player One chose ${choice}`);
      playerOne.off("choice", onChoice);
    } else if (playerTwo === socket) {
      playerTwoChoice = choice;
      playerTwo.emit("choice", `You chose ${choice}`);
      console.log(`Player Two chose ${choice}`);
      playerTwo.off("choice", onChoice);
    }
    setTimeout(() => {
      checkResults();
      playerOneChoice = null;
      playerTwoChoice = null;
    }, 1000);
  };

  const startGame = () => {
    console.log("Starting game...");
    let countdown = 3;
    const interval = setInterval(() => {
      io.emit("countdown", `Starting game in ${countdown}...`);
      console.log(`Starting game in ${countdown}...`);
      countdown--;
      if (countdown === -1) {
        clearInterval(interval);
        io.emit("start", "Game started! Choose your move!");
      }
    }, 1000);
  };

  console.log(`User connected: ${socket.id}`);

  if (!playerOne) {
    playerOne = socket;
    playerOne.emit(
      "player",
      "Connected as playerOne. Waiting for playerTwo..."
    );
    console.log(`Player One connected: ${playerOne.id}`);
  } else if (!playerTwo) {
    playerTwo = socket;
    playerTwo.emit("player", "Connected as playerTwo. Starting game...");
    console.log(`Player Two connected: ${playerTwo.id}`);
    startGame();
  } else {
    console.log("Room is full!");
    socket.emit("error", "Room is full!");
    socket.disconnect(true);
  }

  socket.on("choice", onChoice);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    if (playerOne?.id === socket.id) {
      playerOne = null;
      console.log("Player One disconnected");
      playerTwo?.emit("error", "Player One disconnected!");
      playerTwo?.disconnect(true);
      playerTwo = null;
    } else if (playerTwo?.id === socket.id) {
      playerTwo = null;
      console.log("Player Two disconnected");
      playerOne?.emit("error", "Player Two disconnected!");
      playerOne?.disconnect(true);
      playerOne = null;
    }
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
