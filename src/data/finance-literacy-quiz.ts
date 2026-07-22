/**
 * src/data/finance-literacy-quiz.ts
 * Personal finance literacy quiz content, aligned to (but not copied from)
 * the TIAA Institute–GFLEC P-Fin Index's 8 functional areas: earning,
 * consuming, saving, investing, borrowing & managing debt, insuring,
 * comprehending risk, and go-to information sources. All questions here
 * are original — see PlatformPage.vue's About/History callout for the
 * settlement-unlock promise this content backs.
 */
import type { QuizArea, QuizQuestion } from './quizzes'

// ── P-Fin 8 — one question per literacy area ────────────────────────────────

const PFIN8_QUESTIONS: QuizQuestion[] = [
  {
    // Earning
    question: 'Which of these typically has the biggest effect on your long-run take-home pay?',
    options: [
      'The color of your resume paper',
      'Skills and experience that are in demand, tracked over your career',
      'Working the most overtime hours possible every week',
      'Changing jobs as often as possible regardless of role',
    ],
    correct: 1,
    explanation: 'Earning power compounds over a career the same way savings do — building in-demand skills and experience has a far larger long-run effect than any single tactic like overtime or job-hopping alone.',
  },
  {
    // Consuming
    question: 'A "budget" is best described as:',
    options: [
      'A punishment for overspending',
      'A plan for how income will be spent, saved, and given, made before the money arrives',
      'A record you keep only after you have run out of money',
      'Something only people in debt need',
    ],
    correct: 1,
    explanation: 'A budget is a forward-looking plan, not a retrospective record or a penalty — deciding where money is going before it arrives is what makes it possible to consume within your means.',
  },
  {
    // Saving
    question: 'What is the main advantage of starting to save for a goal earlier rather than later, even with small amounts?',
    options: [
      'Earlier savers get a better interest rate by law',
      'Compound growth has more time to work, so early small amounts can outgrow later large ones',
      'There is no real advantage — total amount saved is all that matters',
      'Banks charge fees on savings started later in life',
    ],
    correct: 1,
    explanation: 'Compound growth means money earns returns on its own returns — the earlier it starts, the more time it has to grow, which is why time in the market often matters more than the size of any single contribution.',
  },
  {
    // Investing
    question: 'Which statement about investing is most accurate?',
    options: [
      'Higher potential returns generally come with higher risk of loss',
      'A guaranteed high return with no risk is a normal, common investment product',
      'Diversifying across different assets always guarantees a profit',
      'Investing and gambling are functionally identical',
    ],
    correct: 0,
    explanation: 'The risk-return relationship is a foundational investing concept — an offer of high guaranteed returns with no risk is a classic warning sign of fraud, not a normal product.',
  },
  {
    // Borrowing & managing debt
    question: 'Why does the interest rate (APR) on a loan or credit card matter so much?',
    options: [
      'It only affects how the paperwork looks',
      'It determines how much extra you pay over time to borrow the money — higher APR means a more expensive debt',
      'APR is purely symbolic and does not affect the amount owed',
      'It only matters for mortgages, not credit cards',
    ],
    correct: 1,
    explanation: 'APR is the cost of borrowing expressed as a yearly rate — a higher APR means more of every payment goes to interest rather than reducing what you actually owe, which is why comparing APRs before borrowing matters.',
  },
  {
    // Insuring
    question: 'What is the basic purpose of insurance?',
    options: [
      'To guarantee you will never lose money',
      'To transfer the financial risk of a large, unpredictable loss to an insurer in exchange for a smaller, predictable payment',
      'To make small routine expenses more convenient to pay',
      'It exists only to comply with legal requirements',
    ],
    correct: 1,
    explanation: 'Insurance trades a known, manageable cost (the premium) for protection against an unknown, potentially large loss — it manages risk, it does not eliminate financial loss altogether.',
  },
  {
    // Comprehending risk
    question: 'If two savings options offer the same expected return, but one has much more year-to-year variation than the other, that variation is best described as:',
    options: [
      'A pricing error the bank will eventually correct',
      'Risk — the chance the actual outcome differs from what was expected',
      'Irrelevant, since the expected return is what matters',
      'Proof the riskier option is a scam',
    ],
    correct: 1,
    explanation: 'Risk is the range of possible outcomes around an expected value, not just the average — two options can share the same expected return while carrying very different risk of falling short of it.',
  },
  {
    // Go-to information sources
    question: 'Before acting on financial advice from social media or an unfamiliar website, what is the most reliable next step?',
    options: [
      'Act immediately — financial opportunities disappear fast',
      'Cross-check the claim against a trusted, independent source (a regulator, a bank, a known nonprofit financial-education body) before committing money',
      'Assume it is true if enough people have commented positively',
      'Ask the same account for more details and trust their answer',
    ],
    correct: 1,
    explanation: 'Verifying financial claims against an independent, trusted source is a core literacy skill — pressure to act "immediately" is itself a common warning sign, and popularity is not verification.',
  },
]

export const PFIN8_AREA: QuizArea = {
  id: 'pfin8', title: 'P-Fin 8 — Personal Finance Basics', emoji: '💰',
  description: 'Eight questions, one for each core personal-finance literacy area: earning, consuming, saving, investing, borrowing, insuring, comprehending risk, and go-to information sources. Aligned to the TIAA Institute–GFLEC P-Fin framework — original questions, not the official quiz.',
  difficulty: 'beginner', color: 'rgba(80,230,130,0.80)',
  badge: 'P-Fin 8 Certified', questionCount: PFIN8_QUESTIONS.length,
  questions: PFIN8_QUESTIONS,
}

// ── P-Fin 28 — deeper pass across the same 8 areas ──────────────────────────
// Gated behind PFIN8_AREA completion in the rewards catalog (see rewards-catalog.ts).

const PFIN28_QUESTIONS: QuizQuestion[] = [
  // Earning (4)
  {
    question: 'Gross pay and net pay differ mainly because of:',
    options: ['Bank fees', 'Taxes and other withholdings taken before you receive your pay', 'Inflation', 'Currency exchange rates'],
    correct: 1,
    explanation: 'Net pay is what lands in your account after taxes, benefits, and other withholdings are subtracted from gross pay — budgeting off gross pay is a common early mistake.',
  },
  {
    question: 'Which is the strongest long-term strategy for increasing earning potential?',
    options: ['Avoiding all job changes for stability', 'Continuously building transferable skills and credentials', 'Working the maximum legal hours every week indefinitely', 'Relying only on annual cost-of-living raises'],
    correct: 1,
    explanation: 'Skills and credentials that transfer across roles and employers compound over a career; hours worked and passive raises have a ceiling that skill-building does not.',
  },
  {
    question: 'A side income or freelance project affects your taxes by:',
    options: ['Being entirely tax-free under all circumstances', 'Typically needing to be reported and possibly taxed, sometimes with different withholding rules than a regular job', 'Only mattering if you earn over $1,000,000', 'Reducing the tax owed on your main job'],
    correct: 1,
    explanation: 'Additional income streams generally need to be reported and can carry different withholding or estimated-tax obligations than a standard paycheck — worth planning for, not assuming away.',
  },
  {
    question: 'Negotiating pay before accepting a job offer is best described as:',
    options: ['Rude and likely to cost you the offer in most professional contexts', 'A normal, expected part of the hiring process in most industries', 'Only appropriate for senior executives', 'Illegal in most places'],
    correct: 1,
    explanation: 'Employers generally expect some negotiation; not asking is one of the more common ways people leave earning potential on the table over a career.',
  },

  // Consuming (3)
  {
    question: 'The "50/30/20" style of budgeting is an example of:',
    options: ['A legal requirement for all bank accounts', 'One common framework for allocating income across needs, wants, and savings/debt', 'A tax bracket system', 'A type of loan'],
    correct: 1,
    explanation: 'Percentage-based budgeting frameworks are one popular way to allocate income, not a rule imposed by any authority — the right split depends on individual circumstances.',
  },
  {
    question: 'Which spending pattern most reliably causes budgets to fail?',
    options: ['Planning grocery spending a week in advance', 'Small, frequent, unplanned purchases that are individually easy to ignore', 'Paying bills on the day they are due', 'Comparing prices before a large purchase'],
    correct: 1,
    explanation: 'Small recurring purchases (subscriptions, daily convenience spending) are individually easy to dismiss but add up faster than most people estimate — tracking them is a core budgeting skill.',
  },
  {
    question: 'A "want" versus a "need" in budgeting terms is best distinguished by:',
    options: ['Price — anything expensive is automatically a want', 'Whether basic functioning (housing, food, essential transport, etc.) depends on it, versus something that adds convenience or enjoyment', 'Brand name recognition', 'Whether it was purchased online or in person'],
    correct: 1,
    explanation: 'The need/want distinction is about function, not price — an expensive necessity is still a need, and a cheap non-essential is still a want.',
  },

  // Saving (4)
  {
    question: 'An "emergency fund" is generally recommended to cover:',
    options: ['One week of expenses', 'Roughly 3–6 months of essential expenses, held somewhere accessible', 'A full year of luxury spending', 'Nothing — insurance always covers emergencies'],
    correct: 1,
    explanation: 'A 3–6 month buffer of essential expenses, kept liquid rather than invested aggressively, is a widely used rule of thumb for absorbing income shocks without going into debt.',
  },
  {
    question: 'Compound interest means:',
    options: ['Interest is only ever paid once', 'Interest earned starts to earn its own interest over time', 'Interest rates always increase each year automatically', 'Compound interest applies only to loans, never to savings'],
    correct: 1,
    explanation: 'Compounding is the mechanism by which a balance grows faster over time, because previously earned interest is added to the principal and itself starts earning — it applies to both savings and debt.',
  },
  {
    question: 'Which factor most directly determines how much a savings balance grows over time, holding contributions equal?',
    options: ['The color of the bank\'s logo', 'The interest/return rate and the length of time the money stays invested', 'How many times you check the balance', 'The day of the week deposits are made'],
    correct: 1,
    explanation: 'Rate of return and time are the two levers that actually drive growth — everything else in that list has no mathematical effect on the balance.',
  },
  {
    question: 'Automating a transfer to savings right after each paycheck ("paying yourself first") is effective mainly because:',
    options: ['It is required by most employers', 'It removes the temptation to spend the money before saving it', 'It earns a legally guaranteed higher interest rate', 'It eliminates the need for a budget entirely'],
    correct: 1,
    explanation: 'Automating savings works by changing the order of operations — money is set aside before it can be spent, rather than saving whatever happens to be left over.',
  },

  // Investing (4)
  {
    question: 'Diversification (spreading money across different investments) mainly helps by:',
    options: ['Guaranteeing a profit', 'Reducing the impact of any single investment performing badly', 'Increasing fees, which increases returns', 'Making an investment portfolio immune to all market downturns'],
    correct: 1,
    explanation: 'Diversification manages risk by not depending on any single outcome — it reduces the impact of one investment doing poorly, but it does not guarantee a profit or eliminate market-wide risk.',
  },
  {
    question: 'A stock represents:',
    options: ['A loan you make to a company that must be repaid on a fixed schedule', 'A share of ownership in a company', 'A government-guaranteed savings product', 'A type of insurance policy'],
    correct: 1,
    explanation: 'Owning a stock means owning a small piece of the company itself, with returns tied to the company\'s performance — unlike a bond, which represents a loan with a defined repayment schedule.',
  },
  {
    question: 'A bond is generally best described as:',
    options: ['Ownership in a company', 'A loan from the investor to the issuer (a company or government), which pays interest and returns principal at maturity', 'A type of currency', 'An insurance contract'],
    correct: 1,
    explanation: 'A bondholder is a lender, not an owner — the issuer promises to pay periodic interest and return the principal at a set maturity date.',
  },
  {
    question: 'Investment fees (expense ratios, management fees) matter because:',
    options: ['They are trivial and rarely affect long-term returns', 'They are subtracted from returns every year and compound over time, so small differences add up significantly over decades', 'They only apply in the first year of investing', 'They are refunded automatically if an investment loses money'],
    correct: 1,
    explanation: 'Because fees are recurring and compound the same way returns do, even a difference of 1% per year can meaningfully change the ending balance over a multi-decade horizon.',
  },

  // Borrowing & managing debt (4)
  {
    question: 'Making only the minimum payment on a credit card balance each month typically results in:',
    options: ['The balance being paid off faster than making larger payments', 'Paying significantly more in total interest and taking much longer to pay off the balance', 'No interest being charged at all', 'An automatic reduction in the interest rate'],
    correct: 1,
    explanation: 'Minimum payments are structured to cover mostly interest and very little principal, which is why balances paid this way can take years and cost far more than the original amount borrowed.',
  },
  {
    question: 'A credit score is generally used by lenders to estimate:',
    options: ['Your annual income', 'How likely you are to repay borrowed money based on your credit history', 'Your job title', 'Your age'],
    correct: 1,
    explanation: 'Credit scores summarize credit history (payment history, amounts owed, length of history, etc.) as a predictor of repayment likelihood — they are not a direct measure of income or employment.',
  },
  {
    question: '"Secured" debt (like a mortgage or auto loan) differs from "unsecured" debt (like most credit cards) mainly because:',
    options: ['Secured debt has no interest', 'Secured debt is backed by collateral the lender can claim if you don\'t pay; unsecured debt is not tied to a specific asset', 'Unsecured debt is always a larger amount', 'There is no real difference'],
    correct: 1,
    explanation: 'Collateral is the key distinction — secured loans let the lender repossess a specific asset (the house, the car) on default, which is generally why secured debt carries a lower interest rate than unsecured debt.',
  },
  {
    question: 'If you are struggling to make debt payments, which is generally the most constructive first step?',
    options: ['Take out a new loan to cover the payments without telling the lender', 'Contact the lender or a nonprofit credit counselor early to discuss options before missing a payment', 'Ignore it — it will resolve itself over time', 'Close all your accounts immediately'],
    correct: 1,
    explanation: 'Lenders and nonprofit credit counselors generally have more options (deferment, restructuring) before a payment is missed than after — early, direct communication tends to produce better outcomes than avoidance.',
  },

  // Insuring (3)
  {
    question: 'A deductible in an insurance policy is:',
    options: ['The maximum amount the insurer will ever pay', 'The amount you pay out of pocket before the insurance coverage begins to pay', 'A monthly fee for having the policy', 'A tax benefit for having insurance'],
    correct: 1,
    explanation: 'The deductible is your share of a claim\'s cost before coverage kicks in — generally, a higher deductible means a lower premium, trading upfront cost for ongoing cost.',
  },
  {
    question: 'Health insurance, auto insurance, and renters/homeowners insurance all share the same core function of:',
    options: ['Guaranteeing you never pay for anything again', 'Pooling risk across many people so that any one person\'s large, unpredictable loss is shared and made manageable', 'Being legally optional everywhere with no consequences', 'Investing your premium for guaranteed growth'],
    correct: 1,
    explanation: 'All insurance types work on the same principle — pooling many people\'s premiums so that the rare large loss any individual might face is absorbed by the group, not just by them alone.',
  },
  {
    question: 'Being "underinsured" means:',
    options: ['Having too many insurance policies', 'Having coverage that would not fully cover the actual cost of a likely loss', 'Paying too much for premiums', 'Having insurance you never plan to use'],
    correct: 1,
    explanation: 'Underinsurance is a coverage-amount problem, not a policy-count problem — it means that if a covered event happened, the payout would fall short of the real cost.',
  },

  // Comprehending risk (3)
  {
    question: 'An investment advertised as guaranteeing "20% returns every month with zero risk" is best understood as:',
    options: ['A rare but legitimate opportunity worth acting on quickly', 'A strong warning sign of fraud — legitimate investments cannot guarantee high returns with no risk', 'Normal for cryptocurrency specifically', 'Guaranteed by federal deposit insurance'],
    correct: 1,
    explanation: 'No legitimate investment can guarantee high returns with zero risk — the risk-return relationship is fundamental, and "guaranteed high return, no risk" is one of the most consistent fraud indicators.',
  },
  {
    question: 'Which best describes "inflation risk"?',
    options: ['The risk that prices will fall so much that money becomes worthless', 'The risk that money\'s purchasing power erodes over time if its growth rate doesn\'t keep pace with rising prices', 'A risk that only affects people who invest in stocks', 'A one-time event rather than an ongoing risk'],
    correct: 1,
    explanation: 'Inflation risk is about purchasing power, not the disappearance of money — savings sitting in a low or zero-interest account can lose real value over time even while the number on the statement stays flat or grows slowly.',
  },
  {
    question: 'Two people have the same amount saved, but one holds it entirely in a single company\'s stock and the other holds it across a broad mix of investments. The first person has taken on more:',
    options: ['Interest rate stability', 'Concentration risk — more of their outcome depends on one specific investment doing well', 'Insurance coverage', 'Tax-free growth'],
    correct: 1,
    explanation: 'Concentration risk is the added risk of depending heavily on a single investment\'s performance rather than spreading exposure — diversification is the direct tool for managing it.',
  },

  // Go-to information sources (3)
  {
    question: 'Which is generally the most reliable way to evaluate a financial product before committing money?',
    options: ['Trusting whichever result appears first in a search engine', 'Comparing terms directly from the provider\'s official disclosures alongside independent, regulator-recognized sources', 'Asking only the person selling the product', 'Assuming all products in the same category are identical'],
    correct: 1,
    explanation: 'Official disclosures plus independent, regulator-recognized sources give a fuller and less biased picture than a single search result or the seller\'s own pitch alone.',
  },
  {
    question: 'A financial professional who is a "fiduciary" is generally expected to:',
    options: ['Sell you the products that pay them the highest commission regardless of fit', 'Act in your best financial interest ahead of their own', 'Guarantee investment returns', 'Only work with people above a certain income'],
    correct: 1,
    explanation: 'Fiduciary duty is a legal/ethical standard requiring advice to be given in the client\'s best interest — not all financial professionals operate under this standard, which is why it is worth asking about directly.',
  },
  {
    question: 'When unsolicited financial advice creates urgency ("act now or lose this opportunity forever"), the appropriate response is generally to:',
    options: ['Act immediately to avoid missing out', 'Treat the urgency itself as a signal to slow down and independently verify before doing anything', 'Share your account details to confirm eligibility', 'Ignore the source but keep the money ready in case it is real'],
    correct: 1,
    explanation: 'Manufactured urgency is one of the most consistent tactics in financial scams — a legitimate opportunity generally survives the time it takes to verify it independently.',
  },
]

export const PFIN28_AREA: QuizArea = {
  id: 'pfin28', title: 'Full P-Fin Index — Deeper Literacy Pass', emoji: '🏦',
  description: '28 questions across the same 8 areas as P-Fin 8, in more depth. Unlocks after completing P-Fin 8. Aligned to the TIAA Institute–GFLEC P-Fin Index structure — original questions, not the official quiz.',
  difficulty: 'intermediate', color: 'rgba(200,170,60,0.80)',
  badge: 'P-Fin Index Master', questionCount: PFIN28_QUESTIONS.length,
  questions: PFIN28_QUESTIONS,
}

export const FINANCE_LITERACY_AREAS: QuizArea[] = [PFIN8_AREA, PFIN28_AREA]
