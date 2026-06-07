# frozen_string_literal: true

# Background materialized processing service for analytics.
# Pre-computes expensive aggregate metrics and caches them
# to avoid synchronous computation during request lifecycles.
#
# Intended to be called from a scheduled background job or rake task.
#
# Usage:
#   AnalyticsCacheWarmer.warm_all
#   AnalyticsCacheWarmer.warm_tag_matrix
#   AnalyticsCacheWarmer.warm_cohort_metrics
class AnalyticsCacheWarmer
  CACHE_TTL = 1.hour

  def self.warm_all
    new.warm_all
  end

  def self.warm_tag_matrix
    new.warm_tag_matrix
  end

  def self.warm_cohort_metrics
    new.warm_cohort_metrics
  end

  def self.warm_item_discrimination
    new.warm_item_discrimination
  end

  def warm_all
    Rails.logger.info("[AnalyticsCacheWarmer] Starting full cache warm...")
    warm_cohort_metrics
    warm_tag_matrix
    warm_item_discrimination
    Rails.logger.info("[AnalyticsCacheWarmer] Full cache warm complete.")
  end

  def warm_cohort_metrics
    Rails.logger.info("[AnalyticsCacheWarmer] Warming cohort metrics...")
    metrics = AnalyticsAggregator.cohort_metrics
    Rails.cache.write(cache_key("cohort_metrics"), metrics, expires_in: CACHE_TTL)
    metrics
  end

  def warm_tag_matrix
    Rails.logger.info("[AnalyticsCacheWarmer] Warming tag matrix...")
    matrix = AnalyticsAggregator.tag_performance_matrix
    Rails.cache.write(cache_key("tag_matrix"), matrix, expires_in: CACHE_TTL)
    matrix
  end

  def warm_item_discrimination
    Rails.logger.info("[AnalyticsCacheWarmer] Warming item discrimination...")
    items = AnalyticsAggregator.item_discrimination_metrics
    Rails.cache.write(cache_key("item_discrimination"), items, expires_in: CACHE_TTL)
    items
  end

  # Read cached cohort metrics (falls back to live computation)
  def self.cohort_metrics
    Rails.cache.fetch(cache_key("cohort_metrics"), expires_in: CACHE_TTL) do
      AnalyticsAggregator.cohort_metrics
    end
  end

  # Read cached tag matrix (falls back to live computation)
  def self.tag_matrix
    Rails.cache.fetch(cache_key("tag_matrix"), expires_in: CACHE_TTL) do
      AnalyticsAggregator.tag_performance_matrix
    end
  end

  # Read cached item discrimination (falls back to live computation)
  def self.item_discrimination
    Rails.cache.fetch(cache_key("item_discrimination"), expires_in: CACHE_TTL) do
      AnalyticsAggregator.item_discrimination_metrics
    end
  end

  private

  def self.cache_key(suffix)
    "analytics/#{suffix}"
  end

  def cache_key(suffix)
    self.class.cache_key(suffix)
  end
end
