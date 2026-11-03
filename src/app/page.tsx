import { CircleStory, TradeExplainer, UnderTheHood, WhoFor } from "@/components/landing/explainers";
import { Faq, Features, FinalCta, Hero, HowItWorks, OpenSource, Safety } from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CircleStory />
      <TradeExplainer />
      <WhoFor />
      <Features />
      <UnderTheHood />
      <Safety />
      <OpenSource />
      <Faq />
      <FinalCta />
    </>
  );
}
