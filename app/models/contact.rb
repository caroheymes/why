class Contact < ApplicationRecord
    include AlgoliaSearch
    algoliasearch per_environment: true do
    attributesToIndex ['company', 'zip', 'city', 'adr', 'chemise','manteau','couette', 'unordered(prestations)', 'region']
    attributesForFaceting ['company']
    end
    
    @@ALGOLIA_INDEX_NAME = "new_pressings"
    
    after_create :index_to_algolia
    after_destroy :remove_from_algolia
    
    def serialize_algolia
        {
            objectID: self.id,
            region:     self.region,
            lat:        self.lat,
            lng:	    self.lng,
            company:	self.company,
            adr:	    self.adr,
            zip:	    self.zip,
            city:	    self.city,
            couette:	self.couette,
            manteau:	self.manteau,
            chemise:	self.chemise,
            facebook:	self.facebook,
            website:	self.website,
            openinghours: self.openinghours,
            clients:	self.clients,
            phone:	    self.phone,
            phone2:	    self.phone2,
            prestations: self.prestations,
            reqgeocode:	self.reqgeocode,
            chmap:	    self.chmap
        }
    end
    
    def self.algolia_import
        self.all.each_slice(1000) do |batch|
        index = Algolia::Index.new(@@ALGOLIA_INDEX_NAME)
        #index.add_objects(Contact.all.map(&:serialize_algolia))
        index.add_objects(batch.map { |contact| contact.serialize_algolia })
        end
    end
    
    def index_to_algolia
        index = Algolia::Index.new(@@ALGOLIA_INDEX_NAME)
        index.save_object(self.serialize_algolia)
    end
    
    def remove_from_algolia
        index = Algolia::Index.new(@@ALGOLIA_INDEX_NAME)
        index.delete_object(self.id)
    end
end
