class ContactsController < ApplicationController
    before_action :find_contact, only: [:show]
    def index
        @contacts = Contact.all
    end
    
    def show
    end
    
    
    private
    def find_contact
    @contact = Contact.find(params[:id])
    end
    
    def contact_params 
      params.require(:contact).permit( :region, :company, :adr, :zip, :city, 
      :couette, :manteau, :chemise, :facebook,:website, :openinghours, :clients, :phone,
      :phone2, :prestations)
    end

end
