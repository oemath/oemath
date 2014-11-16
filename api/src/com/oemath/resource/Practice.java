package com.oemath.resource;

import java.util.ArrayList;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Path("/practice")
public class Practice {

    final static int PRACTICE_NUMBER = 25;
    final static int SAMPLE_NUMBER = 3;
    
    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public Response getPractice(
            @Context HttpServletRequest request,
            @QueryParam("grade") String gradeStr,
            @QueryParam("category") String categoryStr) {

        User user = UserManagement.lookupUser(request);
        boolean paid = user != null && user.isPaymentValid();

        int retStatus = 500;
        String retString = "Error";

        try {
            int grade = Integer.parseInt(gradeStr);
            int category = Integer.parseInt(categoryStr);

            ArrayList<Integer> pidAllList = Database.getProblemIdsFromGradeCategorySample(grade, category, !paid);
        
            if (!Utils.isEmpty(pidAllList)) {
                int count = paid ? PRACTICE_NUMBER : SAMPLE_NUMBER;
                ArrayList<Integer> pidList = Utils.shuffle(pidAllList, count);
                
                HttpSession session = request.getSession(true);
                session.setAttribute(Session.SESSION_ATTRIBUTE_PRACTICE_PIDS, pidList);
                
                JSONObject obj = new JSONObject();
                obj.put("count", count);
    
                retString = obj.toString();
                retStatus = 200;
            }
        }
        catch (NumberFormatException nfe) {
            
        }
        catch (JSONException je) {
            
        }

        return Response
                .status(retStatus)
                .entity(retString)
                .build();
    }
}
