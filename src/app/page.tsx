import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import Impact from "@/components/Impact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative bg-console">
      <main className="relative z-10 mb-[100vh] rounded-b-[2rem] bg-[#f5f3ee] shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:rounded-b-[3rem]">
        <Hero />
        <Problem />
        <HowItWorks />
        <Impact />
      </main>
      <div className="fixed bottom-0 left-0 z-0 w-full h-screen">
        <Footer />
      </div>
    </div>
  );
}
