/** Public receiving details supplied by the owner from their Zempler Business app. */
export const starBankTransfer = {
 businessName:"STAR Development Centre",
 accountHolder:"Dean Parkinson",
 bankName:"Zempler Business",
 sortCode:"08-71-99",
 accountNumber:"14153694"
} as const;
export const sponsorshipOptions=[
 {id:"one-group",title:"One group session",description:"45 minutes for one girl",amountPence:500},
 {id:"four-group",title:"Four group sessions",description:"Four opportunities to train",amountPence:2000},
 {id:"one-local",title:"One individual session · Taunton / Wellington",description:"One hour of personal coaching",amountPence:3500},
 {id:"one-bridgwater",title:"One individual session · Bridgwater",description:"One hour of personal coaching",amountPence:4000},
 {id:"two-local",title:"Two individual sessions · Taunton / Wellington",description:"Two hours of personal coaching",amountPence:7000},
 {id:"two-bridgwater",title:"Two individual sessions · Bridgwater",description:"Two hours of personal coaching",amountPence:8000}
] as const;
export type SponsorshipTransfer={
 id:string;payment_reference:string;title:string;amount_pence:number;
 status:"awaiting_transfer"|"reported_sent"|"confirmed"|"cancelled";created_at:string;
 reported_sent_at?:string|null;confirmed_at?:string|null;
};
export const pounds=(pence:number)=>(pence/100).toLocaleString("en-GB",{style:"currency",currency:"GBP"});
