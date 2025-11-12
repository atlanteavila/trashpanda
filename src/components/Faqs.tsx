import Image from 'next/image'

import { Container } from '@/components/Container'
import backgroundImage from '@/images/background-faqs.jpg'

const faqs = [
  [
    {
      question: 'How do trash-bin pickups work?',
      answer: 'We come to your house the day before the city collects your trash bins. We set them on the curb for you and put them back at the end of the day. Bin cleaning services will be rendered on Weekends.',
    },
    {
      question: 'Is tax included?',
      answer: 'All taxes should be calculated at check out.',
    },
  ],
  [
    {
      question: 'Which areas do you currently serve?',
      answer:
        'We serve Pinehurst and surrounding cities: Aberdeen, Southern Pines. If business needs allow we might be able to service most of Moore County.',
    },
    {
      question: 'Can I schedule a one-off service?',
      answer:
        'Yes! Please contact us to schedule your service today: 925-330-8798.',
    },
  ],
  [
    {
      question: 'Can I pay by cash or check?',
      answer:
        'We only accept credit card payments via our website at the moment. Check back soon though. This might change!',
    },
  ],
]

export function Faqs() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="relative overflow-hidden bg-slate-50 py-20 sm:py-32"
    >
      <Image
        className="absolute top-0 left-1/2 max-w-none translate-x-[-30%] -translate-y-1/4"
        src={backgroundImage}
        alt=""
        width={1558}
        height={946}
        unoptimized
      />
      <Container className="relative">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2
            id="faq-title"
            className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Here's some of the FAQs we've encountered so far. Let us know if you
            have any more questions!
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3"
        >
          {faqs.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-8">
                {column.map((faq, faqIndex) => (
                  <li key={faqIndex}>
                    <h3 className="font-display text-lg/7 text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="mt-4 text-sm text-slate-700">{faq.answer}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
