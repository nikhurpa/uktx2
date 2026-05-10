	


update olt set type='TIP' where type in ('TIP FTTL OLT','TIP OLT');
update olt set type='BBN' where type='NOFN OLT';
update olt set type='BSN' where type='BSNL OLT';
update olt set type='BAF' where type='AIR FIBER';
update olt set type='BNU' where BNU_OLTE_YN='Y';


select * from sch where
 BLOCK IN ('TAKULA')
AND FES IN ('FES','NFS');






