# frozen_string_literal: true

Rails.logger.debug "Creating sample taxonomy data..."

# Only create if no courses exist
if TaxonomyNode.courses.exists?
  Rails.logger.debug "Taxonomy data already exists, skipping."
  exit
end

# ── Create a sample course ────────────────────────────────────────────────────
course = TaxonomyNode.create!(
  name: "Introduction to Microeconomics",
  level: :course,
  description: "Learn the fundamentals of microeconomics including supply, demand, and market equilibrium."
)
Rails.logger.debug { "  Created course: #{course.name}" }

# ── Create parts ─────────────────────────────────────────────────────────────
part1 = TaxonomyNode.create!(
  name: "Part 1: Basic Economic Concepts",
  level: :part,
  parent: course,
  course: course,
  description: "Foundational concepts of economics"
)
Rails.logger.debug { "  Created part: #{part1.name}" }

part2 = TaxonomyNode.create!(
  name: "Part 2: Supply and Demand",
  level: :part,
  parent: course,
  course: course,
  description: "Understanding market forces"
)
Rails.logger.debug { "  Created part: #{part2.name}" }

# ── Create units ──────────────────────────────────────────────────────────────
unit1 = TaxonomyNode.create!(
  name: "Unit 1: Scarcity and Choice",
  level: :unit,
  parent: part1,
  course: course,
  description: "Understanding scarcity and opportunity cost"
)
Rails.logger.debug { "  Created unit: #{unit1.name}" }

unit2 = TaxonomyNode.create!(
  name: "Unit 2: Production Possibilities",
  level: :unit,
  parent: part1,
  course: course,
  description: "The production possibilities frontier"
)
Rails.logger.debug { "  Created unit: #{unit2.name}" }

unit3 = TaxonomyNode.create!(
  name: "Unit 3: Demand",
  level: :unit,
  parent: part2,
  course: course,
  description: "Understanding consumer demand"
)
Rails.logger.debug { "  Created unit: #{unit3.name}" }

unit4 = TaxonomyNode.create!(
  name: "Unit 4: Supply",
  level: :unit,
  parent: part2,
  course: course,
  description: "Understanding producer supply"
)
Rails.logger.debug { "  Created unit: #{unit4.name}" }

# ── Create topics ─────────────────────────────────────────────────────────────
topic1 = TaxonomyNode.create!(
  name: "Opportunity Cost",
  level: :topic,
  parent: unit1,
  course: course,
  description: "The value of the next best alternative"
)
Rails.logger.debug { "  Created topic: #{topic1.name}" }

topic2 = TaxonomyNode.create!(
  name: "Trade-offs and Decisions",
  level: :topic,
  parent: unit1,
  course: course,
  description: "How individuals and societies make trade-offs"
)
Rails.logger.debug { "  Created topic: #{topic2.name}" }

topic3 = TaxonomyNode.create!(
  name: "The Production Possibilities Curve",
  level: :topic,
  parent: unit2,
  course: course,
  description: "Graphing production trade-offs"
)
Rails.logger.debug { "  Created topic: #{topic3.name}" }

topic4 = TaxonomyNode.create!(
  name: "Efficiency and Growth",
  level: :topic,
  parent: unit2,
  course: course,
  description: "Productive and allocative efficiency"
)
Rails.logger.debug { "  Created topic: #{topic4.name}" }

topic5 = TaxonomyNode.create!(
  name: "Law of Demand",
  level: :topic,
  parent: unit3,
  course: course,
  description: "Price and quantity demanded relationship"
)
Rails.logger.debug { "  Created topic: #{topic5.name}" }

topic6 = TaxonomyNode.create!(
  name: "Demand Curve Shifts",
  level: :topic,
  parent: unit3,
  course: course,
  description: "Factors that shift the demand curve"
)
Rails.logger.debug { "  Created topic: #{topic6.name}" }

topic7 = TaxonomyNode.create!(
  name: "Law of Supply",
  level: :topic,
  parent: unit4,
  course: course,
  description: "Price and quantity supplied relationship"
)
Rails.logger.debug { "  Created topic: #{topic7.name}" }

topic8 = TaxonomyNode.create!(
  name: "Market Equilibrium",
  level: :topic,
  parent: unit4,
  course: course,
  description: "Where supply meets demand"
)
Rails.logger.debug { "  Created topic: #{topic8.name}" }

# ── Assign existing questions to topics ──────────────────────────────────────
if Question.any?
  questions = Question.limit(8)
  topics = [topic1, topic2, topic3, topic4, topic5, topic6, topic7, topic8]

  questions.each_with_index do |question, index|
    target_topic = topics[index % topics.length]
    ContentAssignment.create!(
      taxonomy_node: target_topic,
      question: question,
      position: 0
    )
    Rails.logger.debug { "  Assigned question #{question.id} to #{target_topic.name}" }
  end
else
  Rails.logger.debug "  No questions found to assign."
end

# ── Create a second course ────────────────────────────────────────────────────
course2 = TaxonomyNode.create!(
  name: "Introduction to Macroeconomics",
  level: :course,
  description: "Explore national income, inflation, unemployment, and fiscal policy."
)
Rails.logger.debug { "  Created course: #{course2.name}" }

part3 = TaxonomyNode.create!(
  name: "Part 1: Measuring the Economy",
  level: :part,
  parent: course2,
  course: course2,
  description: "GDP, inflation, and unemployment"
)
Rails.logger.debug { "  Created part: #{part3.name}" }

unit5 = TaxonomyNode.create!(
  name: "Unit 1: Gross Domestic Product",
  level: :unit,
  parent: part3,
  course: course2,
  description: "Measuring national income"
)
Rails.logger.debug { "  Created unit: #{unit5.name}" }

topic9 = TaxonomyNode.create!(
  name: "GDP Components",
  level: :topic,
  parent: unit5,
  course: course2,
  description: "Consumption, investment, government spending, and net exports"
)
Rails.logger.debug { "  Created topic: #{topic9.name}" }

topic10 = TaxonomyNode.create!(
  name: "Real vs Nominal GDP",
  level: :topic,
  parent: unit5,
  course: course2,
  description: "Adjusting for inflation"
)
Rails.logger.debug { "  Created topic: #{topic10.name}" }

Rails.logger.debug ""
Rails.logger.debug { "Created #{TaxonomyNode.count} taxonomy nodes total" }
Rails.logger.debug { "  - #{TaxonomyNode.courses.count} courses" }
Rails.logger.debug { "  - #{TaxonomyNode.parts.count} parts" }
Rails.logger.debug { "  - #{TaxonomyNode.units.count} units" }
Rails.logger.debug { "  - #{TaxonomyNode.topics.count} topics" }
Rails.logger.debug { "  - #{ContentAssignment.count} content assignments" }
