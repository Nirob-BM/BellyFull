import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do you accept reservations?",
    answer: "Yes! We highly recommend making reservations, especially for weekends and special occasions. You can book a table through our website, call us at 01863-339695, or visit us in person. We confirm all reservations within 2 hours.",
  },
  {
    question: "What dietary options do you offer?",
    answer: "We cater to various dietary preferences! Our menu includes vegetarian, vegan-friendly options, and we can accommodate most allergies with advance notice. Please inform our staff about any dietary restrictions when ordering.",
  },
  {
    question: "Is parking available?",
    answer: "Yes, we have convenient parking space available near the restaurant. Street parking is also available on Rothkhola Road. For larger groups, we recommend arriving early to secure parking spots.",
  },
  {
    question: "Do you offer takeaway and delivery?",
    answer: "Absolutely! We offer both takeaway and delivery services within Kishoreganj city. You can place orders by calling us directly or through our social media pages. Minimum order applies for delivery.",
  },
  {
    question: "Can you accommodate large groups or private events?",
    answer: "Yes, we love hosting celebrations! Whether it's a birthday party, corporate event, or family gathering, we can accommodate groups of up to 50 people. Contact us in advance for special arrangements and customized menus.",
  },
  {
    question: "What are your payment options?",
    answer: "We accept cash, bKash, Nagad, and major debit/credit cards. For corporate events, we can also arrange invoice-based payments with prior agreement.",
  },
];

const FAQ = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="py-24 bg-gradient-warm" ref={ref}>
      <div className="container">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/20 text-secondary-foreground text-sm font-medium mb-4">
              FAQ
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Frequently Asked <span className="text-secondary">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about dining at Belly Full
            </p>
          </motion.div>

          {/* FAQ Accordion */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card rounded-xl border border-border shadow-elegant px-6 data-[state=open]:shadow-elegant-md transition-all"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-secondary py-5 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              Still have questions?{" "}
              <a 
                href="tel:+8801863339695" 
                className="text-secondary font-semibold hover:underline"
              >
                Give us a call
              </a>{" "}
              or{" "}
              <a 
                href="mailto:bellyfull2022@gmail.com" 
                className="text-secondary font-semibold hover:underline"
              >
                send us an email
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
