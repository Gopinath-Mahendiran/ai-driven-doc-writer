import { Link } from "react-router-dom";
import SplitText from "../components/BlurText";
import { Flex, Text, Button } from "@radix-ui/themes";
import { useState } from "react";


import api from "../api";

const Home = () => {
  const [load ,setLoad] = useState(false);

  const get_git_connection_status = async () => {
    try {
      const response = await api.get("api/code/get/current-status/");
      if (response.status === 200) {
        localStorage.setItem('github_authenticated', response.data.is_github_connected);
      } else {
        throw new Error("Failed to fetch GitHub connection status");
      }
    } catch (error) {
      console.error("Error fetching GitHub connection status:", error);
    }
  }

  const handleAnimationComplete = () => {
  
  setLoad(true)
  console.log('All letters have animated!');
};

  return (
  <div className="text-center text-white px-6 py-24 max-w-4xl mx-auto primary-font">
    <section>
        <SplitText
          text="Ai-Driven Doc Writer"
          className="text-7xl font-semibold text-center"
          delay={50}
          duration={0.4}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />

      { load && <div>
      <p className="text-xl md:text-2xl mb-8 text-gray-300">
        Unleash the power of artificial intelligence to generate flawless, human-like docstrings 
        for your Python code. Explain functions, classes, and entire modules in seconds — 
        no more tedious typing.
      </p>

      <p className="text-lg md:text-xl italic text-blue-400 mb-12">
        From cryptic code to crystal-clear documentation — powered by AI.
      </p>

      <Link to="/githome" className="inline-block" onClick={get_git_connection_status}>
        <Button>
          Get Started Now 🚀
        </Button>
      </Link>
      </div>
      }
    </section>

  </div>


  );
};

export default Home;