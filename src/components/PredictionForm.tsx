import React, { useState } from "react";
import axios, { type AxiosResponse } from "axios";

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    elapsedtime: "",
    velocity: "",
  });
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response: AxiosResponse = await axios.post(
        "http://127.0.0.1:5000/predict",
        {
          elapsedtime: formData.elapsedtime,
          velocity: formData.velocity,
        }
      );

      setPrediction(response.data.prediction);
    } catch (error) {
      console.error("Error making prediction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Prediction Form
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="elapsedtime"
            className="block text-sm font-medium text-gray-700"
          >
            Elapsed Time
          </label>
          <input
            type="number"
            id="elapsedtime"
            name="elapsedtime"
            value={formData.elapsedtime}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label
            htmlFor="velocity"
            className="block text-sm font-medium text-gray-700"
          >
            Velocity
          </label>
          <input
            type="number"
            id="velocity"
            name="velocity"
            value={formData.velocity}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {prediction !== null && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium text-gray-900">
            Prediction Result:
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Predicted Viscosity: {prediction}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Predicted Milk Quality:{" "}
            {prediction > 1.5 && prediction < 2.0 ? "Good Milk" : "Bad Milk"}
          </p>
        </div>
      )}
    </div>
  );
};

export default PredictionForm;
