# frozen_string_literal: true

module TaxonomyNodesHelper
  # Returns the Bootstrap badge class for a taxonomy level
  def taxonomy_node_badge_class(level)
    case level
    when "course" then "bg-primary"
    when "part" then "bg-secondary"
    when "unit" then "bg-info"
    when "topic" then "bg-success"
    else "bg-light"
    end
  end

  # Returns the Bootstrap icon class for a taxonomy level
  def taxonomy_node_icon(level)
    case level
    when "course" then "bi-book"
    when "part" then "bi-collection"
    when "unit" then "bi-folder"
    when "topic" then "bi-file-text"
    else "bi-circle"
    end
  end

  # Returns the hex color for a taxonomy level (used by MUI components)
  def taxonomy_level_color(level)
    case level
    when "course" then "#1976d2"
    when "part" then "#9c27b0"
    when "unit" then "#0288d1"
    when "topic" then "#388e3c"
    else "#757575"
    end
  end

  # Returns a human-readable label for a taxonomy level
  def taxonomy_level_label(level)
    level.to_s.titleize
  end

  # Returns the MUI color name for a taxonomy level
  def taxonomy_level_mui_color(level)
    case level
    when "course" then "primary"
    when "part" then "secondary"
    when "unit" then "info"
    when "topic" then "success"
    else "default"
    end
  end
end
