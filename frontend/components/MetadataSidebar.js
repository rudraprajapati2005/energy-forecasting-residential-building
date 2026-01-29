export default function MetadataSidebar() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-2">Building Info</h3>
        <ul className="text-sm text-gray-700">
          <li>Square Feet: <span className="font-medium">--</span></li>
          <li>Year Built: <span className="font-medium">--</span></li>
          <li>Primary Use: <span className="font-medium">--</span></li>
          <li>Floor Count: <span className="font-medium">--</span></li>
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-2">Weather Summary</h3>
        <ul className="text-sm text-gray-700">
          <li>Avg Temp: <span className="font-medium">--</span></li>
          <li>Cloud Coverage: <span className="font-medium">--</span></li>
          <li>Wind Speed: <span className="font-medium">--</span></li>
        </ul>
      </div>
    </div>
  );
}
