import { Save, CreditCard, PlusCircle } from "lucide-react";

export default function PaymentTab({ paymentMethods = [], onAddPayment }: any) {
  return (
    <div className="p-4 md:p-6">
      <h3 className="text-xl font-bold mb-6">Payment Methods</h3>
      <div className="bg-[#3D2A2F] border border-[#CDAA7D]/30 rounded-lg p-6">
        {paymentMethods.length === 0 ? (
          <div className="text-center">
            <p className="text-lg mb-4">No payment methods added yet.</p>
            <p className="text-sm text-[#F4F0E6]/70 mb-6">
              Add a payment method to purchase gold and support other adventurers.
            </p>
            <button
              className="px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center mx-auto"
              onClick={onAddPayment}
            >
              <PlusCircle size={18} className="mr-2" /> Add Payment Method
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <ul className="space-y-4">
                {paymentMethods.map((method: any, idx: number) => (
                  <li
                    key={method.id || idx}
                    className="flex items-center justify-between bg-[#2C1A1D] border border-[#CDAA7D]/20 rounded-lg px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-[#8B75AA]" />
                      <span className="font-medium text-[#F4F0E6]">
                        {method.type === "card"
                          ? `**** **** **** ${method.last4}`
                          : method.type === "paypal"
                          ? `PayPal: ${method.email}`
                          : method.label}
                      </span>
                      <span className="ml-2 text-xs text-[#CDAA7D]/70">
                        {method.isDefault ? "Default" : ""}
                      </span>
                    </div>
                    <button className="text-xs text-[#CDAA7D] hover:underline">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <button
                className="px-6 py-2 bg-[#8B75AA] text-white rounded font-medium hover:bg-[#7A6699] transition-colors flex items-center justify-center mx-auto"
                onClick={onAddPayment}
              >
                <PlusCircle size={18} className="mr-2" /> Add Another Payment Method
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
