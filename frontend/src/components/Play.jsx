import React from "react";
import { ImageModel } from "react-teachable-machine";

export default function Play({ predictionRef }) {
  const [predictions, setPredictions] = React.useState([]);

  return (
    <>
      <ImageModel
        preview
        size={400}
        interval={100}
        onPredict={setPredictions}
        info={false}
        model_url={process.env.REACT_APP_MODEL_URL}
      />
      {!!predictions &&
        predictions
          .filter((p) => p.probability > 0.5)
          .map((p) => <div ref={predictionRef}>{p.className}</div>)}
    </>
  );
}
