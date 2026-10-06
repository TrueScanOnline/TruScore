/**
 * Seed text for the founder-controlled certification assets.
 * The CSV files in this folder are the same bytes. A unit test keeps them aligned.
 * Runtime does not read the filesystem so Expo Go and TestFlight load the same rows.
 */
export const CERTIFICATION_CATALOGUE_CSV = `certification_id,display_name,family_name,lifecycle,identity_class,supported_scopes,scope_rule,mvp_score_eligible,mvp_points,mvp_receiver,succeeded_by,logo_consumer_display,notes
cert.fairtrade,Fairtrade,Fairtrade,active,certification,whole_product|ingredient_component,explicit_only,True,6,claims_ethics,none,display_if_permissioned,
cert.rainforest_alliance,Rainforest Alliance,Rainforest Alliance,active,certification,whole_product|ingredient_component,explicit_only,True,6,claims_ethics,none,display_if_permissioned,
cert.utz,UTZ Certified,UTZ,legacy,certification,whole_product|ingredient_component,explicit_only,True,6,claims_ethics,cert.rainforest_alliance,display_if_permissioned,Recognise legacy packet evidence; do not rewrite as Rainforest Alliance.
cert.msc,MSC,Marine Stewardship Council,active,certification,whole_product|ingredient_component,explicit_only,True,4,claims_ethics,none,display_if_permissioned,Current MVP scoring mapping preserved; no Planet consequence.
cert.asc,ASC,Aquaculture Stewardship Council,active,certification,whole_product|ingredient_component,explicit_only,True,4,claims_ethics,none,display_if_permissioned,Current MVP scoring mapping preserved; no Planet consequence.
cert.aco_organic,ACO Certified Organic,Australian Certified Organic,active,certification,whole_product|ingredient_component,explicit_only,True,2,claims_ethics,none,display_if_permissioned,Qualifying Organic certification suppresses generic Organic +1 while current.
cert.coeliac_australia,Coeliac Australia Endorsement,Coeliac Australia,active,certification,whole_product,explicit_only,False,0,none,none,display_if_permissioned,Capture as structured evidence; no MVP TruScore consequence.
cert.fodmap_friendly,FODMAP Friendly,FODMAP Friendly,active,certification,whole_product,explicit_only,False,0,none,none,display_if_permissioned,Do not conflate with Monash or generic low-FODMAP wording.
cert.monash_low_fodmap,Monash University Low FODMAP Certified,Monash University,active,certification,whole_product,explicit_only,False,0,none,none,display_if_permissioned,Distinct from FODMAP Friendly; no MVP TruScore consequence.
cert.fsc_mix,FSC Mix,Forest Stewardship Council,active,certification,packaging,explicit_only,False,0,none,none,display_if_permissioned,Capture packaging certification; no MVP Planet scoring/rateability consequence.
`;

export const CERTIFICATION_RECOGNITION_TERMS_CSV = `certification_id,term,term_role,term_type,may_establish_identity
cert.fairtrade,Fairtrade,identity_establishing,name,True
cert.fairtrade,fair trade,discovery_only,search_term,False
cert.rainforest_alliance,Rainforest Alliance,identity_establishing,name,True
cert.utz,UTZ,identity_establishing,name,True
cert.utz,UTZ Certified,identity_establishing,name,True
cert.msc,MSC,identity_establishing,acronym,True
cert.msc,Marine Stewardship Council,identity_establishing,name,True
cert.asc,ASC,identity_establishing,acronym,True
cert.asc,Aquaculture Stewardship Council,identity_establishing,name,True
cert.aco_organic,ACO Certified Organic,identity_establishing,name,True
cert.aco_organic,Australian Certified Organic,identity_establishing,name,True
cert.aco_organic,organic,discovery_only,search_term,False
cert.coeliac_australia,Coeliac Australia,identity_establishing,name,True
cert.coeliac_australia,gluten free,discovery_only,search_term,False
cert.fodmap_friendly,FODMAP Friendly,identity_establishing,name,True
cert.fodmap_friendly,low FODMAP,discovery_only,search_term,False
cert.monash_low_fodmap,Monash University Low FODMAP Certified,identity_establishing,name,True
cert.monash_low_fodmap,low FODMAP,discovery_only,search_term,False
cert.fsc_mix,FSC Mix,identity_establishing,name,True
cert.fsc_mix,FSC,discovery_only,search_term,False
`;

export const CERTIFICATION_ARTWORK_REGISTER_CSV = `certification_id,consumer_display_permission,asset_ref,permission_source,notes
cert.fairtrade,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.rainforest_alliance,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.utz,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.msc,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.asc,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.aco_organic,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.coeliac_australia,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.fodmap_friendly,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.monash_low_fodmap,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
cert.fsc_mix,unknown,,,Consumer display permission only. Internal recognition reference imagery is outside this register.
`;
