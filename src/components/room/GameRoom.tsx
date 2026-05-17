"use client";

import React, { useEffect, useState } from "react";
import { RoomState } from "@/lib/game-types";
import RoomTopBar from "./RoomTopBar";
import QuestionCard from "./QuestionCard";
import PlayerRing from "./PlayerRing";
import QcmAnswers from "./QcmAnswers";
import NumericKeypad from "./NumericKeypad";
import MathInputBox from "./MathInputBox";
import WatchingBanner from "./WatchingBanner";

interface Props {
  state: RoomState;
  myId: string | null;
  onClose: () => void;
  onPickChoice: (idx: number) => void | Promise<void>;
  onSubmitText: (value: string) => void | Promise<void>;
}

export default function GameRoom({
  state,
  myId,
  onClose,
  onPickChoice,
  onSubmitText,
}: Props) {
  const q = state.currentQuestion;
  const myTurn = state.currentPlayerId === myId;
  const lastAnswer = state.lastAnswer;
  const reveal = lastAnswer !== null;

  // Local input state for numeric / math_input — reset on question change
  const [textInput, setTextInput] = useState("");
  useEffect(() => {
    setTextInput("");
  }, [q?.id]);

  const currentPlayer = state.players.find(
    (p) => p.userId === state.currentPlayerId
  );

  return (
    <div
      className="game-room"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "14px 16px 24px",
        minHeight: "100dvh",
        boxSizing: "border-box",
      }}
    >
      <RoomTopBar
        round={state.round || null}
        subject={state.subject}
        onClose={onClose}
      />

      {q && (
        <div className="game-question-panel">
          <QuestionCard key={q.id} latex={q.question} topic={q.topic} />
        </div>
      )}

      <div className="game-ring-panel">
        <PlayerRing
          players={state.players}
          myId={myId}
          currentPlayerId={state.currentPlayerId}
          maxLives={state.maxLives}
          lastAnswer={lastAnswer}
          bombExplodeAt={state.bombExplodeAt}
        />
      </div>

      {/* Bottom area depends on question type and whose turn */}
      {q && (
        <div className="game-answer-panel" style={{ marginTop: 4 }}>
          {myTurn && q.type === "qcm" && q.choices && (
            <QcmAnswers
              choices={q.choices}
              correctChoice={reveal ? q.answer : null}
              myChoice={reveal ? lastAnswer.raw : null}
              reveal={reveal}
              disabled={false}
              onPick={onPickChoice}
            />
          )}

          {myTurn && q.type === "numeric" && (
            <NumericKeypad
              value={textInput}
              onChange={setTextInput}
              onSubmit={() => onSubmitText(textInput)}
              disabled={reveal}
            />
          )}

          {myTurn && q.type === "math_input" && (
            <MathInputBox
              value={textInput}
              onChange={setTextInput}
              onSubmit={() => onSubmitText(textInput)}
              disabled={reveal}
            />
          )}

          {!myTurn && (
            <WatchingBanner playerName={currentPlayer?.handle ?? "player"} />
          )}
        </div>
      )}
    </div>
  );
}
