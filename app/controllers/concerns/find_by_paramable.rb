# frozen_string_literal: true

module FindByParamable
  extend ActiveSupport::Concern

  class_methods do
    def find_by_param(param)
      key = param.to_s
      if key.length >= 36
        uuid = key[0..35]
        find_by(uuid: uuid) || find_by(slug: key) || find_by(id: key)
      else
        find_by(slug: key) || find_by(id: key)
      end
    end
  end
end
