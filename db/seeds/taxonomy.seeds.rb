# frozen_string_literal: true

puts "Creating sample taxonomy data..."

# Only create if no courses exist
if TaxonomyNode.courses.exists?
  puts "Taxonomy data already exists, skipping."
  exit
end

# ── Create a sample course ────────────────────────────────────────────────────
course = TaxonomyNode.create!(
  name: "Introduction to Microeconomics",
  level: :course,
  description: "Learn the fundamentals of microeconomics including supply, demand, and market equilibrium."
)
puts "  Created course: #{course.name}"

# ── Create parts ─────────────────────────────────────────────────────────────
part1 = TaxonomyNode.create!(
  name: "Part 1: Basic Economic Concepts",
  level: :part,
  parent: course,
  course: course,
  description: "Foundational concepts of economics"
)
puts "  Created part: #{part1.name}"

part2 = TaxonomyNode.create!(
  name: "Part 2: Supply and Demand",
  level: :part,
  parent: course,
  course: course,
  description: "Understanding market forces"
)
puts "  Created part: #{part2.name}"

# ── Create units ──────────────────────────────────────────────────────────────
unit1 = TaxonomyNode.create!(
  name: "Unit 1: Scarcity and Choice",
  level: :unit,
  parent: part1,
  course: course,
  description: "Understanding scarcity and opportunity cost"
)
puts "  Created unit: #{unit1.name}"

unit2 = TaxonomyNode.create!(
  name: "Unit 2: Production Possibilities",
  level: :unit,
  parent: part1,
  course: course,
  description: "The production possibilities frontier"
)
puts "  Created unit: #{unit2.name}"

unit3 = TaxonomyNode.create!(
  name: "Unit 3: Demand",
  level: :unit,
  parent: part2,
  course: course,
  description: "Understanding consumer demand"
)
puts "  Created unit: #{unit3.name}"

unit4 = TaxonomyNode.create!(
  name: "Unit 4: Supply",
  level: :unit,
  parent: part2,
  course: course,
  description: "Understanding producer supply"
)
puts "  Created unit: #{unit4.name}"

# ── Create topics ─────────────────────────────────────────────────────────────
topic1 = TaxonomyNode.create!(
  name: "Opportunity Cost",
  level: :topic,
  parent: unit1,
  course: course,
  description: "The value of the next best alternative"
)
puts "  Created topic: #{topic1.name}"

topic2 = TaxonomyNode.create!(
  name: "Trade-offs and Decisions",
  level: :topic,
  parent: unit1,
  course: course,
  description: "How individuals and societies make trade-offs"
)
puts "  Created topic: #{topic2.name}"

topic3 = TaxonomyNode.create!(
  name: "The Production Possibilities Curve",
  level: :topic,
  parent: unit2,
  course: course,
  description: "Graphing production trade-offs"
)
puts "  Created topic: #{topic3.name}"

topic4 = TaxonomyNode.create!(
  name: "Efficiency and Growth",
  level: :topic,
  parent: unit2,
  course: course,
  description: "Productive and allocative efficiency"
)
puts "  Created topic: #{topic4.name}"

topic5 = TaxonomyNode.create!(
  name: "Law of Demand",
  level: :topic,
  parent: unit3,
  course: course,
  description: "Price and quantity demanded relationship"
)
puts "  Created topic: #{topic5.name}"

topic6 = TaxonomyNode.create!(
  name: "Demand Curve Shifts",
  level: :topic,
  parent: unit3,
  course: course,
  description: "Factors that shift the demand curve"
)
puts "  Created topic: #{topic6.name}"

topic7 = TaxonomyNode.create!(
  name: "Law of Supply",
  level: :topic,
  parent: unit4,
  course: course,
  description: "Price and quantity supplied relationship"
)
puts "  Created topic: #{topic7.name}"

topic8 = TaxonomyNode.create!(
  name: "Market Equilibrium",
  level: :topic,
  parent: unit4,
  course: course,
  description: "Where supply meets demand"
)
puts "  Created topic: #{topic8.name}"

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
    puts "  Assigned question #{question.id} to #{target_topic.name}"
  end
else
  puts "  No questions found to assign."
end

# ── Create a second course ────────────────────────────────────────────────────
course2 = TaxonomyNode.create!(
  name: "Introduction to Macroeconomics",
  level: :course,
  description: "Explore national income, inflation, unemployment, and fiscal policy."
)
puts "  Created course: #{course2.name}"

part3 = TaxonomyNode.create!(
  name: "Part 1: Measuring the Economy",
  level: :part,
  parent: course2,
  course: course2,
  description: "GDP, inflation, and unemployment"
)
puts "  Created part: #{part3.name}"

unit5 = TaxonomyNode.create!(
  name: "Unit 1: Gross Domestic Product",
  level: :unit,
  parent: part3,
  course: course2,
  description: "Measuring national income"
)
puts "  Created unit: #{unit5.name}"

topic9 = TaxonomyNode.create!(
  name: "GDP Components",
  level: :topic,
  parent: unit5,
  course: course2,
  description: "Consumption, investment, government spending, and net exports"
)
puts "  Created topic: #{topic9.name}"

topic10 = TaxonomyNode.create!(
  name: "Real vs Nominal GDP",
  level: :topic,
  parent: unit5,
  course: course2,
  description: "Adjusting for inflation"
)
puts "  Created topic: #{topic10.name}"

puts ""
puts "Created #{TaxonomyNode.count} taxonomy nodes total"
puts "  - #{TaxonomyNode.courses.count} courses"
puts "  - #{TaxonomyNode.parts.count} parts"
puts "  - #{TaxonomyNode.units.count} units"
puts "  - #{TaxonomyNode.topics.count} topics"
puts "  - #{ContentAssignment.count} content assignments"
