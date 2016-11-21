package io.fullstack.firestack;

import android.util.Log;
import android.os.Bundle;
import android.content.Intent;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.FirebaseInstanceIdService;

import io.fullstack.firestack.messaging.FirestackMessaging;

public class FirestackInstanceIdService extends FirebaseInstanceIdService {

    private static final String TAG = "FSInstanceIdService";

    /**
     *
     */
    @Override
    public void onTokenRefresh() {
        String refreshedToken = FirebaseInstanceId.getInstance().getToken();
        Log.d(TAG, "Refreshed token: " + refreshedToken);
        Intent i = new Intent(FirestackMessaging.INTENT_NAME_TOKEN);
        Bundle bundle = new Bundle();
        bundle.putString("token", refreshedToken);
        i.putExtras(bundle);
        sendBroadcast(i);
    }
}
