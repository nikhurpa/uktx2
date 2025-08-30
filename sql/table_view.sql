DELIMITER $$

CREATE PROCEDURE get_report(IN p_year INT, IN p_month INT)
BEGIN

 CREATE TEMPORARY TABLE IF NOT EXISTS FAULT_REPORT AS

SELECT `a`.`OA` AS `F_OA`, `a`.`BA` AS `F_BA`, sum(if((`b`.`OA` = `a`.`OA`),1,0)) AS `F_Total`, sum(if((`b`.`MAINTAINED_BY` = 'BA'),1,0)) AS `F_M_BA`, sum(if((`b`.`MAINTAINED_BY` = 'CNTX'),1,0)) AS `F_M_CNTX`, sum(if((`b`.`ROUTE_OWNER` = 'BA'),1,0)) AS `F_O_BA`, sum(if((`b`.`ROUTE_OWNER` = 'CNTX'),1,0)) AS `F_O_CNTX`, sum(if((`b`.`ROUTE_OWNER` = 'VTL'),1,0)) AS `F_O_VTL`, sum(if((`b`.`ROUTE_OWNER` = 'PGCIL'),1,0)) AS `F_O_PGCIL`, sum(if((`b`.`ROUTE_OWNER` = 'OTHER'),1,0)) AS `F_O_OTHER`, sum(if(((to_days(curdate()) - to_days(`b`.`FAULT_DATE`)) > 7),1,0)) AS `F_M7`, sum(if(((to_days(curdate()) - to_days(`b`.`FAULT_DATE`)) > 30),1,0)) AS `F_M30` FROM (`oa_table` `a` left join `faults` `b` on((`a`.`OA` = `b`.`OA`))) WHERE (`b`.`RESTORATION_DATE` is null) GROUP BY `a`.`OA` ;


CREATE TEMPORARY TABLE IF NOT EXISTS MTTR AS

SELECT a.OA, sum(if(b.OA=a.OA,1,0))as Total,   sum(if(b.MAINTAINED_BY = 'BA',1,0)) AS `M_BA`, sum(if(b.MAINTAINED_BY = 'CNTX',1,0)) AS `M_CNTX` ,sum(if(b.ROUTE_OWNER = 'BA',1,0)) AS `O_BA`,sum(if(b.ROUTE_OWNER  = 'CNTX',1,0)) AS `O_CNTX` ,sum(if(b.ROUTE_OWNER = 'VTL',1,0)) AS `O_VTL`,sum(if(b.ROUTE_OWNER  = 'PGCIL',1,0)) AS `O_PGCIL` ,
sum(if(b.ROUTE_OWNER  = 'OTHER',1,0)) AS `O_OTHER` ,
ROUND((AVG(TIMESTAMPDIFF(HOUR, b.FAULT_DATE, b.RESTORATION_DATE)),1) AS MTTR
from oa_table a left join faults b on a.OA=b.OA
where b.RESTORATION_DATE IS NOT NULL group by a.OA 
AND MONTH( b.FAULT_DATE) =  p_year
  AND YEAR( b.FAULT_DATE) =  p_month;

SELECT 
      c.*,d.*
    FROM FAULT_REPORT c
    LEFT JOIN MTTR d ON c.F_OA=d.oa;  -- join everything to the same avg
END$$

DELIMITER ;
