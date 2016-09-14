package io.fullstack.firestack;

/**
 * Created by nori on 2016/09/12.
 */
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;

public class FirestackInstanceIdService extends FirebaseInstanceIdService {

    private static final String TAG = "FSInstanceIdService";

    /**
     *
     */
    @Override
    public void onTokenRefresh() {
        String refreshedToken = FirebaseInstanceId.getInstance().getToken();
        Log.d(TAG, "Refreshed token: " + refreshedToken);


        // send Intent
        Intent i = new Intent(FirestackCloudMessaging.INTENT_NAME_TOKEN);
        Bundle bundle = new Bundle();
        bundle.putString("token", refreshedToken);
        i.putExtras(bundle);
        sendBroadcast(i);
    }
}
