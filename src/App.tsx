import RealTimeDashboard from "./components/RealTimeDashboard";
import PredictionForm from "./components/PredictionForm";

function App() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Milk Quality Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
        <div className="md:col-span-7">
          <RealTimeDashboard />
        </div>
        <div className="md:col-span-3">
          <PredictionForm />
        </div>
      </div>
    </div>
  );
}

export default App;
