# frozen_string_literal: true

namespace :analytics do
  desc "Warm all analytics caches (cohort metrics, tag matrix, item discrimination)"
  task warm_cache: :environment do
    AnalyticsCacheWarmer.warm_all
  end

  desc "Warm cohort metrics cache"
  task warm_cohort: :environment do
    AnalyticsCacheWarmer.warm_cohort_metrics
  end

  desc "Warm tag performance matrix cache"
  task warm_tag_matrix: :environment do
    AnalyticsCacheWarmer.warm_tag_matrix
  end

  desc "Warm item discrimination cache"
  task warm_item_discrimination: :environment do
    AnalyticsCacheWarmer.warm_item_discrimination
  end
end
