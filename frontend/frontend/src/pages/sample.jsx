import api from "../api";
import { useState } from "react";
import Button from "../components/Button";


const Sample = () => {
      const [sampleData, setSampleData] = useState(null);
      const [error, setError] = useState("");
      
      const fetchSampleData = async () => {
      try {
            const response = await api.get("/api/code/sample/");
            console.log("Sample data response:", response.data);
            setSampleData(response.data);
            setError("");
      } catch (err) {
            setError("Failed to fetch sample data. Please try again.");
            console.error(err);
      }
      };
      
      return (
      <div className="text-center text-white px-6 py-24 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Sample Data Fetcher</h1>
            <Button
            onClick={fetchSampleData} 

            >
            Fetch Sample Data
            </Button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {sampleData && (
            <pre className="mt-6 bg-gray-800 p-4 rounded">
            {JSON.stringify(sampleData, null, 2)}
            </pre>
            )}
      </div>
      );
      }

export default Sample;