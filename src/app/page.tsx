import { Faq, Features, FinalCta, Hero, HowItWorks, OpenSource, Safety } from "@/components/landing/sections";

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <Safety />
      <OpenSource />
      <Faq />
      <FinalCta />
    </>
  );
}
