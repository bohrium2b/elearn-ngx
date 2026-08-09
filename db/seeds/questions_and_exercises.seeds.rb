# frozen_string_literal: true

Rails.logger.debug "Creating questions, tags, exercises, and associations..."

# Helper to get or create a tag with a deterministic slug
def ensure_tag(name, parent: nil, taxonomy_node: nil)
  Tag.find_or_create_by!(name: name) do |tag|
    tag.parent = parent
    tag.taxonomy_node = taxonomy_node
  end
end

# Helper to create a question
def create_question(title, config_data)
  Question.create!(config_data: config_data.merge("question" => title))
end

# ── Tags ──────────────────────────────────────────────────────────────────────
tag_math = ensure_tag("math")
tag_econ = ensure_tag("econ")

tag_algebra = ensure_tag("algebra", parent: tag_math)
tag_calc = ensure_tag("calculus", parent: tag_math)
tag_micro = ensure_tag("microeconomics", parent: tag_econ)
tag_macro = ensure_tag("macroeconomics", parent: tag_econ)

tag_supply = ensure_tag("supply")
tag_demand = ensure_tag("demand")
tag_equilibrium = ensure_tag("equilibrium")
tag_gdp = ensure_tag("gdp")
tag_inflation = ensure_tag("inflation")

all_tags = [tag_math, tag_econ, tag_algebra, tag_calc, tag_micro, tag_macro, tag_supply, tag_demand, tag_equilibrium, tag_gdp, tag_inflation]

# ── Questions ─────────────────────────────────────────────────────────────────
questions_config = [
  {
    title: "What is opportunity cost?",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "The value of the next best alternative foregone", "correct" => true, "rationale" => "Opportunity cost is what you give up." },
        { "content" => "The total cost of all alternatives", "correct" => false, "rationale" => "That's not opportunity cost." },
        { "content" => "The monetary price of a good", "correct" => false, "rationale" => "Price is not the same as opportunity cost." }
      ],
      "numChoices" => 1,
      "hints" => ["Think about trade-offs."]
    }
  },
  {
    title: "A Production Possibilities Frontier illustrates:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Trade-offs between two goods", "correct" => true, "rationale" => "The PPF shows maximum production combinations." },
        { "content" => "How to maximize profit", "correct" => false, "rationale" => "PPF is about production capacity." },
        { "content" => "Consumer preferences", "correct" => false, "rationale" => "Preferences are shown by indifference curves." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "Which of the following causes a demand curve to shift right?",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Increase in consumer income", "correct" => true, "rationale" => "Higher income increases demand for normal goods." },
        { "content" => "Increase in the price of the good", "correct" => false, "rationale" => "That causes a movement along the curve." },
        { "content" => "Decrease in the price of substitutes", "correct" => false, "rationale" => "That would decrease demand." }
      ],
      "numChoices" => 1,
      "hints" => ["Consider factors other than the good's own price."]
    }
  },
  {
    title: "The law of supply states that:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "As price increases, quantity supplied increases", "correct" => true, "rationale" => "Direct relationship between price and quantity supplied." },
        { "content" => "As price increases, quantity supplied decreases", "correct" => false, "rationale" => "That describes demand." },
        { "content" => "Supply is fixed in the short run", "correct" => false, "rationale" => "Supply can vary with price." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "Market equilibrium occurs where:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Quantity demanded equals quantity supplied", "correct" => true, "rationale" => "Equilibrium is where the curves intersect." },
        { "content" => "Price is at its maximum", "correct" => false, "rationale" => "Equilibrium is not necessarily the highest price." },
        { "content" => "Government sets the price", "correct" => false, "rationale" => "That describes a price control, not equilibrium." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "GDP measures:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "The total market value of all final goods and services produced within a country in a period", "correct" => true, "rationale" => "That is the standard GDP definition." },
        { "content" => "The total income of all citizens", "correct" => false, "rationale" => "GDP is about domestic production." },
        { "content" => "The value of all financial transactions", "correct" => false, "rationale" => "Financial assets are not counted in GDP." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "Real GDP adjusts nominal GDP for:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Inflation", "correct" => true, "rationale" => "Real GDP uses constant prices to remove inflation effects." },
        { "content" => "Population changes", "correct" => false, "rationale" => "That gives GDP per capita." },
        { "content" => "Unemployment", "correct" => false, "rationale" => "Unemployment is not an adjustment for GDP." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "Unemployment that results from a recession is called:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Cyclical unemployment", "correct" => true, "rationale" => "Cyclical unemployment rises during downturns." },
        { "content" => "Frictional unemployment", "correct" => false, "rationale" => "Frictional unemployment is from normal job search." },
        { "content" => "Structural unemployment", "correct" => false, "rationale" => "Structural comes from skill mismatches." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "Which of the following is included in M1 but not M2?",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Demand deposits", "correct" => true, "rationale" => "M1 includes currency and demand deposits; M2 adds savings deposits." },
        { "content" => "Savings deposits", "correct" => false, "rationale" => "Savings deposits are in M2 but not M1." },
        { "content" => "Money market funds", "correct" => false, "rationale" => "Those are in M2." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "What is the integral of x dx?",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "x^2/2 + C", "correct" => true, "rationale" => "Power rule for integration." },
        { "content" => "x + C", "correct" => false, "rationale" => "Missing the square." },
        { "content" => "e^x + C", "correct" => false, "rationale" => "That is the integral of e^x." }
      ],
      "numChoices" => 1,
      "hints" => ["Use the power rule."]
    }
  },
  {
    title: "If demand increases and supply is constant, equilibrium price will:",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "Rise", "correct" => true, "rationale" => "Higher demand pushes price up." },
        { "content" => "Fall", "correct" => false, "rationale" => "Lower demand would do that." },
        { "content" => "Stay the same", "correct" => false, "rationale" => "Equilibrium price changes with demand." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  },
  {
    title: "Which of the following is a normative economic statement?",
    config_data: {
      "type" => "multi-choice",
      "choices" => [
        { "content" => "The government ought to provide universal healthcare", "correct" => true, "rationale" => "Normative statements express value judgments using 'ought'." },
        { "content" => "A price ceiling creates a shortage", "correct" => false, "rationale" => "That is a positive statement." },
        { "content" => "Unemployment is currently 5%", "correct" => false, "rationale" => "That is a factual claim." }
      ],
      "numChoices" => 1,
      "hints" => []
    }
  }
]

questions = questions_config.map do |q|
  create_question(q[:title], q[:config_data])
end

Rails.logger.debug { "  Created #{questions.count} questions" }

# ── Associate questions with tags ──────────────────────────────────────────────
tag_econ.questions << questions[0..4]
tag_micro.questions << questions[0..2]
tag_macro.questions << questions[5..7]
tag_demand.questions << questions[2]
tag_supply.questions << questions[3]
tag_equilibrium.questions << questions[4]
tag_gdp.questions << questions[5]
tag_inflation.questions << questions[7]
tag_math.questions << questions[9]
tag_calc.questions << questions[9]
tag_algebra.questions << questions[10]

Rails.logger.debug { "  Associated questions with tags" }

# ── Associate questions with taxonomy topics via ContentAssignment ──────────────
topics = TaxonomyNode.topics.to_a

question_assignments = [
  [0, 8],   # Opportunity Cost
  [1, 10],  # Trade-offs
  [2, 12],  # Demand Curve Shifts
  [3, 14],  # Law of Supply
  [4, 15],  # Market Equilibrium
  [5, 19],  # GDP Components
  [6, 20],  # Real vs Nominal GDP
  [7, 19],  # Unemployment (GDP Components)
  [8, 19],  # Money Supply (GDP Components)
  [9, 19],  # Integral (GDP Components)
  [10, 12], # Price ceiling (Demand Curve Shifts)
  [11, 8]   # Normative (Opportunity Cost)
]

question_assignments.each do |q_idx, topic_id|
  topic = TaxonomyNode.find_by(id: topic_id)
  next unless topic

  ContentAssignment.find_or_create_by!(taxonomy_node: topic, question: questions[q_idx]) do |ca|
    ca.position = 0
  end
end

Rails.logger.debug { "  Assigned #{question_assignments.count} questions to topics" }

# ── Associate tags with topics via TopicTag ────────────────────────────────────
[8, 9, 10, 11, 12, 13, 14, 15].each do |topic_id|
  TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: topic_id), tag: tag_micro)
end

[19, 20].each do |topic_id|
  TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: topic_id), tag: tag_macro)
end

[12, 13].each do |topic_id|
  TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: topic_id), tag: tag_demand)
end

TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 14), tag: tag_supply)
TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 15), tag: tag_equilibrium)
TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 19), tag: tag_gdp)
TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 20), tag: tag_inflation)

[8, 9, 10].each do |topic_id|
  TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: topic_id), tag: tag_math)
end

TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 9), tag: tag_calc)
TopicTag.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 10), tag: tag_algebra)

Rails.logger.debug { "  Associated tags with topics" }

# ── Exercises ──────────────────────────────────────────────────────────────────
# Use dynamic_tag rules referencing existing tags
exercise1_spec = {
  "selection_rules" => [
    { "type" => "dynamic_tag", "tag_uuid" => tag_micro.uuid, "count" => 3, "strategy" => "random" },
    { "type" => "static_question", "question_uuid" => questions[0].uuid }
  ]
}

exercise2_spec = {
  "selection_rules" => [
    { "type" => "dynamic_tag", "tag_uuid" => tag_demand.uuid, "count" => 1, "strategy" => "random" }
  ]
}

exercise3_spec = {
  "selection_rules" => [
    { "type" => "dynamic_tag", "tag_uuid" => tag_macro.uuid, "count" => 3, "strategy" => "random" }
  ]
}

exercise4_spec = {
  "selection_rules" => [
    { "type" => "dynamic_tag", "tag_uuid" => tag_calc.uuid, "count" => 1, "strategy" => "random" }
  ]
}

exercise5_spec = {
  "selection_rules" => [
    { "type" => "dynamic_tag", "tag_uuid" => tag_equilibrium.uuid, "count" => 1, "strategy" => "random" }
  ]
}

exercise1 = Exercise.find_or_create_by!(title: "Microeconomics Practice", slug: "microeconomics-practice") do |e|
  e.primary_topic = TaxonomyNode.find_by(id: 8)
  e.spec = exercise1_spec
  e.is_practice = true
end

exercise2 = Exercise.find_or_create_by!(title: "Demand Quiz", slug: "demand-quiz") do |e|
  e.primary_topic = TaxonomyNode.find_by(id: 12)
  e.spec = exercise2_spec
  e.is_practice = false
end

exercise3 = Exercise.find_or_create_by!(title: "Macroeconomics Assessment", slug: "macroeconomics-assessment") do |e|
  e.primary_topic = TaxonomyNode.find_by(id: 19)
  e.spec = exercise3_spec
  e.is_practice = false
end

exercise4 = Exercise.find_or_create_by!(title: "Calculus Review", slug: "calculus-review") do |e|
  e.primary_topic = TaxonomyNode.find_by(id: 9)
  e.spec = exercise4_spec
  e.is_practice = true
end

exercise5 = Exercise.find_or_create_by!(title: "Market Equilibrium Test", slug: "market-equilibrium-test") do |e|
  e.primary_topic = TaxonomyNode.find_by(id: 15)
  e.spec = exercise5_spec
  e.is_practice = false
end

Rails.logger.debug { "  Created #{Exercise.count} exercises" }

# ── Associate exercises with topics via TopicExercise ─────────────────────────
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 8), exercise: exercise1)
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 12), exercise: exercise2)
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 13), exercise: exercise2)
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 19), exercise: exercise3)
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 20), exercise: exercise3)
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 9), exercise: exercise4)
TopicExercise.find_or_create_by!(taxonomy_node: TaxonomyNode.find_by(id: 15), exercise: exercise5)

Rails.logger.debug { "  Associated exercises with topics" }

# ── Summary ────────────────────────────────────────────────────────────────────
Rails.logger.debug ""
Rails.logger.debug { "Questions: #{Question.count}" }
Rails.logger.debug { "Tags: #{Tag.count}" }
Rails.logger.debug { "Exercises: #{Exercise.count}" }
Rails.logger.debug { "ContentAssignments: #{ContentAssignment.count}" }
Rails.logger.debug { "TopicTags: #{TopicTag.count}" }
Rails.logger.debug { "TopicExercises: #{TopicExercise.count}" }
