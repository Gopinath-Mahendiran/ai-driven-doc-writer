import React from "react";
import isAuthenticated from "../utils/Authentication";
import { Link } from "react-router-dom";
import Button from "../components/Button";
const Home = () => {
  return (
  <div className="text-center text-white px-6 py-24 max-w-4xl mx-auto primary-font">
      <h1 className="text-5xl md:text-4xl font-bold mb-6 ">
        🚀 AI-Driven Docstring Forge
      </h1>

      <p className="text-xl md:text-2xl mb-8 text-gray-300">
        Unleash the power of artificial intelligence to generate flawless, human-like docstrings 
        for your Python code. Explain functions, classes, and entire modules in seconds — 
        no more tedious typing.
      </p>

      <p className="text-lg md:text-xl italic text-blue-400 mb-12">
        From cryptic code to crystal-clear documentation — powered by AI.
      </p>

      <Link to="/start">
        <Button>
          Get Started Now 🚀
        </Button>
      </Link>
  </div>


  );
};

export default Home;