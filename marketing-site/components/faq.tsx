"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What kind of brands do you work with?",
    answer:
      "We work primarily with ecommerce and service businesses doing at least £10k/month in revenue that are ready to invest seriously in paid acquisition on Meta.",
  },
  {
    question: "How fast will I see results?",
    answer:
      "Most clients see meaningful signal within the first 2-3 weeks of launch, and a clear performance trend by month two. Real scale typically compounds from month three onward.",
  },
  {
    question: "Do you require long-term contracts?",
    answer:
      "No. We work month-to-month because we'd rather earn your business through results than lock you in. Most clients stay because the numbers make sense.",
  },
  {
    question: "Who creates the ad creative?",
    answer:
      "Our in-house creative team handles scripting, editing and design, and we can also work with your existing creators or brand assets if you have them.",
  },
  {
    question: "What does it cost to work with Scale Storm?",
    answer:
      "Pricing depends on your ad spend and scope of work. Book a free strategy call and we'll walk you through a plan and pricing tailored to your goals.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-white/55">
            Everything you need to know before getting started.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="text-sm font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-white/40 transition-transform",
                      isOpen && "rotate-180 text-white"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm leading-relaxed text-white/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
