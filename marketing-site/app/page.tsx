import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { Services } from "@/components/services";
import { Process } from "@/components/process";
import { Testimonials } from "@/components/testimonials";
import { CTA } from "@/components/cta";
import { FAQ } from "@/components/faq";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <Services />
      <Process />
      <Testimonials />
      <CTA />
      <FAQ />
    </>
  );
}
