# frozen_string_literal: true

require "fileutils"

namespace :mathjax do
  desc "Copy MathJax v4 source into public/mathjax so Rails serves worker files"
  task copy: :environment do
    src = Rails.root.join("node_modules/@mathjax/src")
    dest = Rails.public_path.join("mathjax")

    unless File.directory?(src)
      puts "@mathjax/src not found in node_modules. Run 'yarn add @mathjax/src' first."
      next
    end

    FileUtils.rm_rf(dest)
    FileUtils.mkdir_p(dest)
    FileUtils.cp_r(Dir.glob(File.join(src, "*")), dest)
    puts "Copied MathJax source to #{dest}"
  end
end

# Hook into rails assets:precompile so MathJax is copied automatically
Rake::Task["assets:precompile"].enhance(["mathjax:copy"])
