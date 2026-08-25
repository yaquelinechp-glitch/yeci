import Solicitudes from './Solicitudes';
import PartnersList from './PartnersList';

export default function PartnersOverview() {
  return (
    <div className="space-y-12 animate-fade-in">
      <Solicitudes />
      <div className="border-t border-gray-200"></div>
      <PartnersList />
    </div>
  );
}
